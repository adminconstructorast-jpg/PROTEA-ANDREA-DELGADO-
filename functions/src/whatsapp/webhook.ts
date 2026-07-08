import { createHmac, timingSafeEqual } from 'node:crypto';
import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import {
  REGION,
  WHATSAPP_TOKEN,
  WHATSAPP_APP_SECRET,
  WHATSAPP_VERIFY_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID,
} from '../config.js';
import { db, FieldValue, Timestamp } from '../lib/admin.js';
import {
  parseWebhook,
  markAsRead,
  sendText,
  sendInteractiveButtons,
  sendInteractiveList,
  type InboundMessage,
  type StatusUpdate,
} from '../lib/whatsapp.js';
import { advanceFlow, type OutboundAction } from '../lib/rsvpFlow.js';
import {
  COLLECTIONS,
  waIdToPhone,
  type EventDoc,
  type Guest,
  type WAConversation,
} from '../shared.js';

/**
 * Webhook de WhatsApp Business.
 *  - GET: verificación del endpoint (hub.challenge).
 *  - POST: procesamiento en tiempo real de respuestas de invitados (RSVP)
 *          y actualizaciones de estado de entrega.
 *
 * Prioriza responder 200 rápido a Meta y procesar de forma idempotente.
 */
export const whatsappWebhook = onRequest(
  {
    region: REGION,
    secrets: [WHATSAPP_TOKEN, WHATSAPP_APP_SECRET, WHATSAPP_VERIFY_TOKEN],
    // Meta requiere el cuerpo crudo para validar la firma.
    // firebase-functions expone rawBody en onRequest.
  },
  async (req, res) => {
    // ── Verificación del webhook (handshake de Meta) ──
    if (req.method === 'GET') {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];
      if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN.value()) {
        res.status(200).send(String(challenge));
      } else {
        res.status(403).send('Forbidden');
      }
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    // ── Validación de firma X-Hub-Signature-256 ──
    if (!verifySignature(req)) {
      logger.warn('WhatsApp webhook: firma inválida');
      res.status(401).send('Invalid signature');
      return;
    }

    // Responder 200 cuanto antes; procesar luego.
    res.status(200).send('EVENT_RECEIVED');

    try {
      const { messages, statuses } = parseWebhook(req.body);
      const token = WHATSAPP_TOKEN.value();
      const phoneNumberId = WHATSAPP_PHONE_NUMBER_ID.value();

      for (const message of messages) {
        await handleInboundMessage(message, token, phoneNumberId);
      }
      for (const status of statuses) {
        await handleStatusUpdate(status);
      }
    } catch (err) {
      logger.error('Error procesando webhook de WhatsApp', err);
    }
  },
);

/** Verifica la firma HMAC-SHA256 del cuerpo con el App Secret. */
function verifySignature(req: {
  get: (h: string) => string | undefined;
  rawBody?: Buffer;
}): boolean {
  const signature = req.get('x-hub-signature-256');
  const appSecret = WHATSAPP_APP_SECRET.value();
  if (!signature || !req.rawBody || !appSecret) return false;

  const expected =
    'sha256=' + createHmac('sha256', appSecret).update(req.rawBody).digest('hex');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Registra el mensaje en el log inmutable y evita reprocesar duplicados. */
async function logMessage(
  message: InboundMessage,
  eventId?: string,
  guestId?: string,
): Promise<boolean> {
  const ref = db.collection(COLLECTIONS.WA_MESSAGES).doc(message.messageId);
  try {
    await ref.create({
      id: message.messageId,
      direction: 'inbound',
      phone: waIdToPhone(message.from),
      eventId: eventId ?? null,
      guestId: guestId ?? null,
      type: message.type,
      payload: message,
      createdAt: FieldValue.serverTimestamp(),
    });
    return true; // nuevo
  } catch {
    return false; // ya existía (idempotencia)
  }
}

/** Localiza al invitado por teléfono (E.164) vía collection group. */
async function findGuestByPhone(
  phone: string,
): Promise<{ guest: Guest; eventId: string; ref: FirebaseFirestore.DocumentReference } | null> {
  const snap = await db
    .collectionGroup(COLLECTIONS.GUESTS)
    .where('phone', '==', phone)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0]!;
  const guest = doc.data() as Guest;
  return { guest, eventId: guest.eventId, ref: doc.ref };
}

async function handleInboundMessage(
  message: InboundMessage,
  token: string,
  phoneNumberId: string,
): Promise<void> {
  if (message.type === 'other') return;

  const phone = waIdToPhone(message.from);

  // Marcar como leído (no bloqueante para la lógica).
  void markAsRead({ token, phoneNumberId, messageId: message.messageId });

  const found = await findGuestByPhone(phone);
  if (!found) {
    logger.info(`Mensaje de número no vinculado a invitado: ${phone}`);
    await logMessage(message);
    return;
  }

  const { guest, eventId, ref: guestRef } = found;
  const isNew = await logMessage(message, eventId, guest.id);
  if (!isNew) return; // duplicado ya procesado

  // Cargar evento (configuración de RSVP).
  const eventSnap = await db.collection(COLLECTIONS.EVENTS).doc(eventId).get();
  if (!eventSnap.exists) return;
  const event = eventSnap.data() as EventDoc;

  // Cargar / iniciar conversación (doc id = wa_id).
  const convRef = db.collection(COLLECTIONS.WA_CONVERSATIONS).doc(message.from);
  const convSnap = await convRef.get();

  const now = Timestamp.now();
  const conversation: WAConversation = convSnap.exists
    ? (convSnap.data() as WAConversation)
    : {
        id: message.from,
        eventId,
        guestId: guest.id,
        step: 'awaiting_confirmation',
        answers: {},
        startedAt: now,
        updatedAt: now,
        expiresAt: Timestamp.fromMillis(now.toMillis() + 24 * 60 * 60 * 1000),
      };

  // Avanzar la máquina de estados.
  const result = advanceFlow({
    event: { name: event.name, rsvp: event.rsvp },
    conversation,
    text: message.text,
    replyId: message.replyId,
  });

  // Ajuste: cuando confirma y hay múltiples lugares, el flujo genérico no
  // conoce seatsAllocated; si el invitado tiene 1 solo lugar saltamos la
  // pregunta de acompañantes marcándolo aquí.
  const guestPatch: Partial<Guest> = { ...result.guestPatch };
  if (result.nextStep === 'awaiting_companions' && guest.seatsAllocated <= 1) {
    guestPatch.companionsConfirmed = 0;
  }

  // Persistir en una transacción lógica (batch).
  const batch = db.batch();
  batch.set(
    convRef,
    {
      ...conversation,
      step: result.nextStep,
      answers: { ...conversation.answers, ...result.answersPatch },
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  batch.set(
    guestRef,
    {
      ...guestPatch,
      respondedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  await batch.commit();

  // Enviar mensajes de salida.
  for (const action of result.outbound) {
    await dispatch(action, phone, token, phoneNumberId);
  }
}

/** Traduce una acción del flujo a una llamada concreta de la API. */
async function dispatch(
  action: OutboundAction,
  to: string,
  token: string,
  phoneNumberId: string,
): Promise<void> {
  switch (action.kind) {
    case 'text':
      await sendText({ token, phoneNumberId, to, text: action.body });
      break;
    case 'buttons':
      await sendInteractiveButtons({
        token,
        phoneNumberId,
        to,
        bodyText: action.body,
        header: action.header,
        footer: action.footer,
        buttons: action.buttons,
      } as never);
      break;
    case 'list':
      await sendInteractiveList({
        token,
        phoneNumberId,
        to,
        bodyText: action.body,
        buttonText: action.buttonText,
        options: action.options,
      });
      break;
  }
}

/** Actualiza el estado de entrega del último mensaje saliente del invitado. */
async function handleStatusUpdate(status: StatusUpdate): Promise<void> {
  const phone = waIdToPhone(status.recipientId);
  const found = await findGuestByPhone(phone);
  if (!found) return;

  await found.ref.set(
    {
      whatsapp: {
        lastDeliveryStatus: status.status,
        ...(status.status === 'failed' && status.errorTitle
          ? { lastError: status.errorTitle, reachable: false }
          : { reachable: true }),
      },
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}
