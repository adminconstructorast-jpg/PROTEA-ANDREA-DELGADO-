import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import {
  REGION,
  PLANNER_EMAIL,
  PLANNER_PHONE,
  WHATSAPP_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID,
  APP_CHECK_ENFORCE,
} from '../config.js';
import { db, FieldValue } from '../lib/admin.js';
import { queueMail, emailLayout } from '../lib/mail.js';
import { sendText } from '../lib/whatsapp.js';
import {
  COLLECTIONS,
  quoteRequestSchema,
  normalizePhone,
  eventDisplayLabel,
  SERVICE_LABELS,
  BUDGET_RANGE_LABELS,
  type Lead,
  type BudgetRange,
  type ServiceOption,
} from '../shared.js';

/** Puntaje heurístico 0–100 de un lead según presupuesto y servicios. */
function scoreLead(lead: Pick<Lead, 'budgetRange' | 'services' | 'guestCount' | 'hasVenue'>): number {
  const budgetPoints: Record<BudgetRange, number> = {
    under_150k: 10,
    '150k_300k': 25,
    '300k_600k': 40,
    '600k_1m': 55,
    over_1m: 70,
    undefined: 15,
  };
  let score = budgetPoints[lead.budgetRange] ?? 15;
  score += Math.min(lead.services.length * 3, 20);
  if (lead.guestCount >= 150) score += 5;
  if (lead.hasVenue) score += 5;
  return Math.max(0, Math.min(100, score));
}

/**
 * HTTPS Callable: recibe la cotización del sitio público, la valida con el
 * esquema compartido y crea el Lead. Alternativa robusta a escribir directo
 * a Firestore desde el cliente (permite normalización y scoring server-side).
 */
export const submitQuoteRequest = onCall({ region: REGION }, async (request) => {
  logger.info("submitQuoteRequest iniciada", { 
    appCheckEnforce: APP_CHECK_ENFORCE.value(), 
    hasApp: !!request.app,
    appToken: request.app ? "PRESENTE" : "MISSING"
  });

  // Refuerzo anti-abuso: cuando App Check está activo, exige un token válido
  if (APP_CHECK_ENFORCE.value() === 'true' && !request.app) {
    logger.warn("App Check bloqueó la solicitud por token faltante");
    throw new HttpsError(
      'failed-precondition',
      'Solicitud no verificada. Recarga la página e inténtalo de nuevo.',
    );
  }

  logger.info("Validando datos con quoteRequestSchema...", { data: request.data });
  const parsed = quoteRequestSchema.safeParse(request.data);
  if (!parsed.success) {
    logger.error("Error de validación en quoteRequestSchema:", parsed.error.format());
    throw new HttpsError('invalid-argument', 'Datos de cotización inválidos', parsed.error.flatten());
  }

  const d = parsed.data;
  const phone = normalizePhone(d.phone) ?? d.phone;

  const score = scoreLead({
    budgetRange: d.budgetRange,
    services: d.services as ServiceOption[],
    guestCount: d.guestCount,
    hasVenue: d.hasVenue,
  });

  logger.info(`Escribiendo lead en Firestore. Score calculado: ${score}`);
  
  try {
    const leadRef = await db.collection(COLLECTIONS.LEADS).add({
      contact: { fullName: d.fullName, email: d.email, phone },
      eventType: d.eventType,
      eventSubtype: d.eventSubtype ?? null,
      tentativeDate: d.tentativeDate,
      dateIsFlexible: d.dateIsFlexible,
      guestCount: d.guestCount,
      hasVenue: d.hasVenue,
      venueName: d.venueName ?? null,
      city: d.city ?? null,
      budgetRange: d.budgetRange,
      services: d.services,
      message: d.message ?? null,
      status: 'new',
      score,
      source: 'web_quote_form',
      utm: d.utm ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });

    logger.info(`Nuevo lead guardado exitosamente: ${leadRef.id}`);
    return { id: leadRef.id, ok: true };
  } catch (error: any) {
    logger.error("Error crítico al guardar el lead en Firestore:", {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    throw new HttpsError('internal', 'Error al guardar la cotización en el servidor', error.message);
  }
});

/**
 * Trigger: al crearse un Lead (por el callable o por escritura directa del
 * cotizador), notifica a la planner por correo y WhatsApp.
 */
export const onLeadCreated = onDocumentCreated(
  {
    region: REGION,
    document: `${COLLECTIONS.LEADS}/{leadId}`,
    secrets: [WHATSAPP_TOKEN],
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const lead = snap.data() as Lead;
    const leadId = event.params.leadId;

    // Completar score si el lead entró por escritura directa (reglas de cliente).
    if (lead.score === undefined) {
      const score = scoreLead(lead);
      await snap.ref.set({ score }, { merge: true });
      lead.score = score;
    }

    // Ocasión específica si el lead la trae; si no, el tipo genérico.
    const eventLabel = eventDisplayLabel(lead.eventType, lead.eventSubtype);
    const servicesLabel = (lead.services ?? [])
      .map((s) => SERVICE_LABELS[s] ?? s)
      .join(', ');
    const budgetLabel = BUDGET_RANGE_LABELS[lead.budgetRange] ?? lead.budgetRange;

    // ── Correo a la planner ──
    const html = emailLayout(
      'Nueva solicitud de cotización ✨',
      `
        <p>Se registró un nuevo prospecto desde el sitio web.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:6px 0;color:#8c8577;">Nombre</td><td style="text-align:right;"><strong>${escapeHtml(lead.contact.fullName)}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#8c8577;">Correo</td><td style="text-align:right;">${escapeHtml(lead.contact.email)}</td></tr>
          <tr><td style="padding:6px 0;color:#8c8577;">Teléfono</td><td style="text-align:right;">${escapeHtml(lead.contact.phone)}</td></tr>
          <tr><td style="padding:6px 0;color:#8c8577;">Tipo de evento</td><td style="text-align:right;">${escapeHtml(eventLabel)}</td></tr>
          <tr><td style="padding:6px 0;color:#8c8577;">Fecha tentativa</td><td style="text-align:right;">${escapeHtml(lead.tentativeDate ?? 'Flexible')}</td></tr>
          <tr><td style="padding:6px 0;color:#8c8577;">Invitados</td><td style="text-align:right;">${lead.guestCount}</td></tr>
          <tr><td style="padding:6px 0;color:#8c8577;">Venue</td><td style="text-align:right;">${lead.hasVenue ? escapeHtml(lead.venueName ?? 'Sí') : 'Por definir'}</td></tr>
          <tr><td style="padding:6px 0;color:#8c8577;">Presupuesto</td><td style="text-align:right;">${escapeHtml(budgetLabel)}</td></tr>
          <tr><td style="padding:6px 0;color:#8c8577;">Servicios</td><td style="text-align:right;">${escapeHtml(servicesLabel)}</td></tr>
          <tr><td style="padding:6px 0;color:#8c8577;">Score</td><td style="text-align:right;"><strong>${lead.score ?? '—'}/100</strong></td></tr>
        </table>
        ${lead.message ? `<p style="margin-top:16px;padding:12px;background:#fff;border-left:3px solid #a58e6f;">${escapeHtml(lead.message)}</p>` : ''}
      `,
    );

    try {
      await queueMail({
        to: PLANNER_EMAIL.value(),
        replyTo: lead.contact.email,
        subject: `Nuevo lead: ${lead.contact.fullName} · ${eventLabel}`,
        html,
      });
    } catch (err) {
      logger.error('No se pudo encolar el correo de nuevo lead', err);
    }

    // ── WhatsApp a la planner ──
    const plannerPhone = PLANNER_PHONE.value();
    if (plannerPhone) {
      const text =
        `✨ *Nuevo lead PROTEA*\n\n` +
        `👤 ${lead.contact.fullName}\n` +
        `📅 ${eventLabel} · ${lead.tentativeDate ?? 'fecha flexible'}\n` +
        `👥 ${lead.guestCount} invitados\n` +
        `💰 ${budgetLabel}\n` +
        `⭐ Score ${lead.score ?? '—'}/100\n` +
        `📞 ${lead.contact.phone}`;
      try {
        await sendText({
          token: WHATSAPP_TOKEN.value(),
          phoneNumberId: WHATSAPP_PHONE_NUMBER_ID.value(),
          to: plannerPhone,
          text,
        });
      } catch (err) {
        logger.error('No se pudo notificar por WhatsApp a la planner', err);
      }
    }

    logger.info(`Notificaciones enviadas para lead ${leadId}`);
  },
);

/** Escapa HTML para evitar inyección en los correos. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
