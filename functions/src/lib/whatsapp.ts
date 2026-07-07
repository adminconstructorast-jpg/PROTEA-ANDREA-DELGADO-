import { GRAPH_API_VERSION } from '../config.js';

/**
 * Cliente mínimo de la WhatsApp Business Cloud API (Meta Graph).
 * Cubre lo necesario para el módulo de RSVP: plantillas, texto,
 * botones interactivos y marcado de mensajes como leídos.
 */

export interface WhatsAppSendResult {
  ok: boolean;
  /** wamid del mensaje saliente si tuvo éxito. */
  messageId?: string;
  error?: string;
}

interface SendArgs {
  token: string;
  phoneNumberId: string;
  to: string; // E.164 sin '+' o con '+'; Meta acepta ambos, normalizamos sin '+'
  payload: Record<string, unknown>;
}

async function post({ token, phoneNumberId, to, payload }: SendArgs): Promise<WhatsAppSendResult> {
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`;
  const body = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: to.replace(/^\+/, ''),
    ...payload,
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const json = (await res.json()) as {
      messages?: Array<{ id: string }>;
      error?: { message?: string };
    };

    if (!res.ok) {
      return { ok: false, error: json.error?.message ?? `HTTP ${res.status}` };
    }
    return { ok: true, messageId: json.messages?.[0]?.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'network error' };
  }
}

/** Envía una plantilla aprobada (Save the date / invitación / recordatorio). */
export function sendTemplate(args: {
  token: string;
  phoneNumberId: string;
  to: string;
  templateName: string;
  languageCode?: string;
  /** Variables del cuerpo, en orden {{1}}, {{2}}... */
  bodyParams?: string[];
  /** Botones quick-reply con payload personalizado (opcional). */
  buttonPayloads?: string[];
}): Promise<WhatsAppSendResult> {
  const components: Array<Record<string, unknown>> = [];

  if (args.bodyParams && args.bodyParams.length > 0) {
    components.push({
      type: 'body',
      parameters: args.bodyParams.map((text) => ({ type: 'text', text })),
    });
  }

  if (args.buttonPayloads) {
    args.buttonPayloads.forEach((payload, index) => {
      components.push({
        type: 'button',
        sub_type: 'quick_reply',
        index: String(index),
        parameters: [{ type: 'payload', payload }],
      });
    });
  }

  return post({
    token: args.token,
    phoneNumberId: args.phoneNumberId,
    to: args.to,
    payload: {
      type: 'template',
      template: {
        name: args.templateName,
        language: { code: args.languageCode ?? 'es_MX' },
        ...(components.length > 0 ? { components } : {}),
      },
    },
  });
}

/** Envía un mensaje de texto simple (solo dentro de la ventana de 24h). */
export function sendText(args: {
  token: string;
  phoneNumberId: string;
  to: string;
  text: string;
}): Promise<WhatsAppSendResult> {
  return post({
    token: args.token,
    phoneNumberId: args.phoneNumberId,
    to: args.to,
    payload: { type: 'text', text: { preview_url: false, body: args.text } },
  });
}

/** Envía un mensaje con botones interactivos de respuesta (Confirmar/Rechazar). */
export function sendInteractiveButtons(args: {
  token: string;
  phoneNumberId: string;
  to: string;
  bodyText: string;
  buttons: Array<{ id: string; title: string }>; // máx 3, título ≤ 20 chars
  headerText?: string;
  footerText?: string;
}): Promise<WhatsAppSendResult> {
  const interactive: Record<string, unknown> = {
    type: 'button',
    body: { text: args.bodyText },
    action: {
      buttons: args.buttons.slice(0, 3).map((b) => ({
        type: 'reply',
        reply: { id: b.id, title: b.title.slice(0, 20) },
      })),
    },
  };
  if (args.headerText) interactive.header = { type: 'text', text: args.headerText };
  if (args.footerText) interactive.footer = { text: args.footerText };

  return post({
    token: args.token,
    phoneNumberId: args.phoneNumberId,
    to: args.to,
    payload: { type: 'interactive', interactive },
  });
}

/** Envía una lista interactiva (p. ej. opciones de menú). */
export function sendInteractiveList(args: {
  token: string;
  phoneNumberId: string;
  to: string;
  bodyText: string;
  buttonText: string;
  options: Array<{ id: string; title: string; description?: string }>;
}): Promise<WhatsAppSendResult> {
  return post({
    token: args.token,
    phoneNumberId: args.phoneNumberId,
    to: args.to,
    payload: {
      type: 'interactive',
      interactive: {
        type: 'list',
        body: { text: args.bodyText },
        action: {
          button: args.buttonText.slice(0, 20),
          sections: [
            {
              title: 'Opciones',
              rows: args.options.slice(0, 10).map((o) => ({
                id: o.id,
                title: o.title.slice(0, 24),
                description: o.description?.slice(0, 72),
              })),
            },
          ],
        },
      },
    },
  });
}

/** Marca un mensaje entrante como leído (mejor UX en el chat del invitado). */
export function markAsRead(args: {
  token: string;
  phoneNumberId: string;
  messageId: string;
}): Promise<WhatsAppSendResult> {
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${args.phoneNumberId}/messages`;
  return fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${args.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: args.messageId,
    }),
  })
    .then((res) => ({ ok: res.ok }))
    .catch((err) => ({ ok: false, error: err instanceof Error ? err.message : 'error' }));
}

// ── Parsing de payloads entrantes del webhook ────────────────────────────────

export interface InboundMessage {
  from: string; // wa_id (E.164 sin '+')
  messageId: string;
  timestamp: string;
  type: 'text' | 'interactive' | 'button' | 'other';
  text?: string;
  /** id del botón/opción cuando el invitado responde interactivamente. */
  replyId?: string;
  replyTitle?: string;
  contactName?: string;
}

export interface StatusUpdate {
  messageId: string;
  recipientId: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  errorTitle?: string;
}

/** Extrae mensajes entrantes y actualizaciones de estado de un webhook de Meta. */
export function parseWebhook(body: unknown): {
  messages: InboundMessage[];
  statuses: StatusUpdate[];
} {
  const messages: InboundMessage[] = [];
  const statuses: StatusUpdate[] = [];

  const entries = (body as { entry?: unknown[] })?.entry;
  if (!Array.isArray(entries)) return { messages, statuses };

  for (const entry of entries) {
    const changes = (entry as { changes?: unknown[] })?.changes;
    if (!Array.isArray(changes)) continue;

    for (const change of changes) {
      const value = (change as { value?: Record<string, unknown> })?.value;
      if (!value) continue;

      const contacts = value.contacts as Array<{ wa_id: string; profile?: { name?: string } }> | undefined;
      const contactName = contacts?.[0]?.profile?.name;

      const rawMessages = value.messages as Array<Record<string, any>> | undefined;
      for (const m of rawMessages ?? []) {
        const base = {
          from: String(m.from),
          messageId: String(m.id),
          timestamp: String(m.timestamp),
          contactName,
        };
        if (m.type === 'text') {
          messages.push({ ...base, type: 'text', text: m.text?.body });
        } else if (m.type === 'interactive') {
          const reply = m.interactive?.button_reply ?? m.interactive?.list_reply;
          messages.push({
            ...base,
            type: 'interactive',
            replyId: reply?.id,
            replyTitle: reply?.title,
          });
        } else if (m.type === 'button') {
          // Botón de plantilla (quick reply) — el payload viaja en m.button.payload
          messages.push({
            ...base,
            type: 'button',
            replyId: m.button?.payload,
            replyTitle: m.button?.text,
            text: m.button?.text,
          });
        } else {
          messages.push({ ...base, type: 'other' });
        }
      }

      const rawStatuses = value.statuses as Array<Record<string, any>> | undefined;
      for (const s of rawStatuses ?? []) {
        statuses.push({
          messageId: String(s.id),
          recipientId: String(s.recipient_id),
          status: s.status,
          errorTitle: s.errors?.[0]?.title,
        });
      }
    }
  }

  return { messages, statuses };
}
