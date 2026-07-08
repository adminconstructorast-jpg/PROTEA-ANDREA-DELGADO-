import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';
import {
  REGION,
  WHATSAPP_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID,
} from '../config.js';
import { db, FieldValue, Timestamp } from '../lib/admin.js';
import { sendTemplate } from '../lib/whatsapp.js';
import { BUTTON_IDS } from '../lib/rsvpFlow.js';
import { COLLECTIONS, type EventDoc, type Guest } from '../shared.js';

type CampaignKind = 'save_the_date' | 'invitation' | 'reminder';

/** Solo staff/planner puede lanzar campañas. */
function assertStaff(auth: { token?: Record<string, unknown> } | undefined): void {
  const role = auth?.token?.role;
  if (role !== 'planner' && role !== 'staff') {
    throw new HttpsError('permission-denied', 'Requiere rol planner o staff.');
  }
}

function templateFor(event: EventDoc, kind: CampaignKind): string | undefined {
  switch (kind) {
    case 'save_the_date':
      return event.rsvp.saveTheDateTemplate;
    case 'invitation':
      return event.rsvp.invitationTemplate;
    case 'reminder':
      return event.rsvp.reminderTemplate;
  }
}

/** Formatea la fecha del evento para variables de plantilla. */
function eventDateLabel(event: EventDoc): string {
  try {
    return event.date.toDate().toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

/**
 * Callable: envío masivo de una campaña de RSVP a los invitados de un evento.
 * Filtra por estado (p. ej. solo 'pending' o 'invited') y respeta límites.
 */
export const sendRsvpCampaign = onCall(
  { region: REGION, secrets: [WHATSAPP_TOKEN] },
  async (request) => {
    assertStaff(request.auth as never);

    const { eventId, kind, statuses } = request.data as {
      eventId: string;
      kind: CampaignKind;
      statuses?: Guest['rsvpStatus'][];
    };
    if (!eventId || !kind) {
      throw new HttpsError('invalid-argument', 'eventId y kind son obligatorios.');
    }

    const eventSnap = await db.collection(COLLECTIONS.EVENTS).doc(eventId).get();
    if (!eventSnap.exists) {
      throw new HttpsError('not-found', 'Evento no encontrado.');
    }
    const event = eventSnap.data() as EventDoc;

    const templateName = templateFor(event, kind);
    if (!templateName) {
      throw new HttpsError(
        'failed-precondition',
        `No hay plantilla configurada para "${kind}" en este evento.`,
      );
    }

    const token = WHATSAPP_TOKEN.value();
    const phoneNumberId = WHATSAPP_PHONE_NUMBER_ID.value();
    const dateLabel = eventDateLabel(event);

    const filterStatuses = statuses ?? ['pending'];
    const guestsSnap = await db
      .collection(COLLECTIONS.EVENTS)
      .doc(eventId)
      .collection(COLLECTIONS.GUESTS)
      .where('rsvpStatus', 'in', filterStatuses)
      .get();

    let sent = 0;
    let failed = 0;

    for (const doc of guestsSnap.docs) {
      const guest = doc.data() as Guest;
      const result = await sendTemplate({
        token,
        phoneNumberId,
        to: guest.phone,
        templateName,
        bodyParams: [guest.fullName, event.name, dateLabel],
        // Para la invitación formal adjuntamos botones Confirmar/Rechazar.
        buttonPayloads:
          kind === 'invitation' ? [BUTTON_IDS.CONFIRM, BUTTON_IDS.DECLINE] : undefined,
      });

      const patch: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
      if (result.ok) {
        sent += 1;
        const stamp = FieldValue.serverTimestamp();
        patch.whatsapp = {
          reachable: true,
          lastOutboundMessageId: result.messageId ?? null,
          ...(kind === 'save_the_date' ? { saveTheDateSentAt: stamp } : {}),
          ...(kind === 'invitation' ? { invitationSentAt: stamp } : {}),
          ...(kind === 'reminder'
            ? { lastReminderSentAt: stamp, remindersSent: FieldValue.increment(1) }
            : {}),
        };
        if (kind === 'invitation' && guest.rsvpStatus === 'pending') {
          patch.rsvpStatus = 'invited';
        }
      } else {
        failed += 1;
        patch.whatsapp = { reachable: false, lastError: result.error ?? 'error' };
      }
      await doc.ref.set(patch, { merge: true });
    }

    logger.info(`Campaña ${kind} evento ${eventId}: ${sent} enviados, ${failed} fallidos`);
    return { sent, failed, total: guestsSnap.size };
  },
);

/**
 * Recordatorios automáticos: cada día revisa eventos próximos y reenvía
 * la plantilla de recordatorio a los invitados aún 'pending'/'invited',
 * respetando `reminderDaysBefore`.
 */
export const scheduledRsvpReminders = onSchedule(
  { region: REGION, schedule: 'every day 10:00', timeZone: 'America/Mexico_City', secrets: [WHATSAPP_TOKEN] },
  async () => {
    const token = WHATSAPP_TOKEN.value();
    const phoneNumberId = WHATSAPP_PHONE_NUMBER_ID.value();
    const now = Timestamp.now();

    // Eventos futuros con RSVP activo.
    const eventsSnap = await db
      .collection(COLLECTIONS.EVENTS)
      .where('date', '>=', now)
      .get();

    for (const eventDoc of eventsSnap.docs) {
      const event = eventDoc.data() as EventDoc;
      if (!event.rsvp?.enabled || !event.rsvp.reminderTemplate) continue;

      const daysUntil = Math.ceil(
        (event.date.toMillis() - now.toMillis()) / (24 * 60 * 60 * 1000),
      );
      if (!event.rsvp.reminderDaysBefore?.includes(daysUntil)) continue;

      const dateLabel = eventDateLabel(event);
      const pendingSnap = await eventDoc.ref
        .collection(COLLECTIONS.GUESTS)
        .where('rsvpStatus', 'in', ['pending', 'invited'])
        .get();

      for (const guestDoc of pendingSnap.docs) {
        const guest = guestDoc.data() as Guest;
        const result = await sendTemplate({
          token,
          phoneNumberId,
          to: guest.phone,
          templateName: event.rsvp.reminderTemplate,
          bodyParams: [guest.fullName, event.name, dateLabel],
        });
        if (result.ok) {
          await guestDoc.ref.set(
            {
              whatsapp: {
                lastReminderSentAt: FieldValue.serverTimestamp(),
                remindersSent: FieldValue.increment(1),
              },
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
        }
      }
      logger.info(`Recordatorios enviados para evento ${eventDoc.id} (T-${daysUntil} días)`);
    }
  },
);
