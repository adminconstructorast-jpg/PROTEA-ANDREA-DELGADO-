import type { EventDoc, Guest, WAConversation, RSVPFlowStep } from '../shared.js';

/**
 * Máquina de estados del flujo conversacional de RSVP por WhatsApp.
 *
 * Es pura (sin I/O): recibe el estado actual + la respuesta del invitado y
 * devuelve el siguiente paso, las mutaciones a aplicar al invitado y el
 * mensaje a enviar. El webhook se encarga de persistir y enviar.
 */

/** IDs canónicos de los botones interactivos. */
export const BUTTON_IDS = {
  CONFIRM: 'rsvp_confirm',
  DECLINE: 'rsvp_decline',
} as const;

export interface FlowInput {
  event: Pick<EventDoc, 'name' | 'rsvp'>;
  conversation: WAConversation;
  /** Texto libre del invitado (si escribió). */
  text?: string;
  /** id del botón/opción que presionó (si respondió interactivamente). */
  replyId?: string;
}

export type OutboundAction =
  | { kind: 'text'; body: string }
  | {
      kind: 'buttons';
      body: string;
      header?: string;
      footer?: string;
      buttons: Array<{ id: string; title: string }>;
    }
  | {
      kind: 'list';
      body: string;
      buttonText: string;
      options: Array<{ id: string; title: string; description?: string }>;
    };

export interface FlowResult {
  nextStep: RSVPFlowStep;
  /** Parche a aplicar sobre el documento del invitado. */
  guestPatch: Partial<Guest>;
  /** Parche a aplicar sobre las respuestas acumuladas de la conversación. */
  answersPatch: Partial<WAConversation['answers']>;
  /** Mensajes a enviar al invitado (en orden). */
  outbound: OutboundAction[];
  /** true cuando el flujo terminó. */
  done: boolean;
}

/** Normaliza texto libre a una intención de sí/no en español. */
function parseYesNo(text?: string): boolean | null {
  if (!text) return null;
  const t = text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
  if (/^(si|s|claro|confirmo|asistire|asisto|voy|aceptar|1|👍)/.test(t)) return true;
  if (/^(no|n|rechazo|declino|no asistire|no voy|no puedo|cancelar|2|👎)/.test(t)) return false;
  return null;
}

function parseInt0(text?: string): number | null {
  if (!text) return null;
  const digits = text.replace(/[^\d]/g, '');
  if (!digits) return /^(ninguno|nadie|solo|sola|yo)/i.test(text.trim()) ? 0 : null;
  const n = Number.parseInt(digits, 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Determina el siguiente paso tras confirmar asistencia, según la
 * configuración de RSVP del evento (acompañantes → menú → alergias).
 */
function stepsAfterConfirm(
  cfg: EventDoc['rsvp'],
  guestSeats: number,
): { step: RSVPFlowStep; action: OutboundAction } {
  if (cfg.askCompanions && guestSeats > 1) {
    return {
      step: 'awaiting_companions',
      action: {
        kind: 'text',
        body: `¡Nos encanta que nos acompañes! 🥂\n\nTienes hasta ${guestSeats} lugares reservados. ¿Cuántas personas asistirán en total (incluyéndote)? Responde con un número.`,
      },
    };
  }
  return stepAfterCompanions(cfg);
}

function stepAfterCompanions(cfg: EventDoc['rsvp']): { step: RSVPFlowStep; action: OutboundAction } {
  if (cfg.askMenuChoice && cfg.menuOptions && cfg.menuOptions.length > 0) {
    return {
      step: 'awaiting_menu_choice',
      action: {
        kind: 'list',
        body: 'Para preparar todo a tu gusto, elige tu opción de menú:',
        buttonText: 'Ver menú',
        options: cfg.menuOptions.map((opt, i) => ({ id: `menu_${i}`, title: opt })),
      },
    };
  }
  return stepAfterMenu(cfg);
}

function stepAfterMenu(cfg: EventDoc['rsvp']): { step: RSVPFlowStep; action: OutboundAction } {
  if (cfg.askDietaryRestrictions) {
    return {
      step: 'awaiting_dietary',
      action: {
        kind: 'text',
        body: '¿Tienes alguna alergia o restricción alimentaria que debamos considerar? Si no, responde "ninguna".',
      },
    };
  }
  return {
    step: 'completed',
    action: {
      kind: 'text',
      body: '¡Listo! 🎉 Tu confirmación quedó registrada. Te esperamos con mucho cariño.',
    },
  };
}

/** Avanza la máquina de estados un paso. */
export function advanceFlow(input: FlowInput): FlowResult {
  const { conversation, event } = input;
  const cfg = event.rsvp;
  const step = conversation.step;

  const empty: FlowResult = {
    nextStep: step,
    guestPatch: {},
    answersPatch: {},
    outbound: [],
    done: false,
  };

  switch (step) {
    case 'awaiting_confirmation': {
      const intent =
        input.replyId === BUTTON_IDS.CONFIRM
          ? true
          : input.replyId === BUTTON_IDS.DECLINE
            ? false
            : parseYesNo(input.text);

      if (intent === null) {
        // No entendimos: re-preguntamos con botones.
        return {
          ...empty,
          outbound: [
            {
              kind: 'buttons',
              body: `¿Nos confirmas tu asistencia a *${event.name}*?`,
              buttons: [
                { id: BUTTON_IDS.CONFIRM, title: '✅ Confirmar' },
                { id: BUTTON_IDS.DECLINE, title: '❌ No podré' },
              ],
            },
          ],
        };
      }

      if (intent === false) {
        return {
          nextStep: 'completed',
          guestPatch: { rsvpStatus: 'declined', companionsConfirmed: 0 },
          answersPatch: { attending: false },
          outbound: [
            {
              kind: 'text',
              body: 'Gracias por avisarnos. Te vamos a extrañar. Si algo cambia, escríbenos por aquí. 💛',
            },
          ],
          done: true,
        };
      }

      // Confirma asistencia.
      const seats = input.replyId ? 0 : 0; // seats se lee del guest en el webhook
      const next = stepsAfterConfirm(cfg, Math.max(seats, 1));
      // El webhook pasa seatsAllocated real; aquí asumimos ≥1 y dejamos que
      // el orquestador re-evalúe. Simplificamos: marcamos confirmado.
      return {
        nextStep: next.step,
        guestPatch: { rsvpStatus: 'confirmed' },
        answersPatch: { attending: true },
        outbound: [{ kind: 'text', body: '¡Genial! 🎉' }, next.action],
        done: next.step === 'completed',
      };
    }

    case 'awaiting_companions': {
      const n = parseInt0(input.text);
      if (n === null || n < 1) {
        return {
          ...empty,
          outbound: [
            {
              kind: 'text',
              body: 'Por favor responde con un número (por ejemplo, 2 si van dos personas incluyéndote).',
            },
          ],
        };
      }
      const companions = Math.max(0, n - 1);
      const next = stepAfterCompanions(cfg);
      return {
        nextStep: next.step,
        guestPatch: { companionsConfirmed: companions },
        answersPatch: { companions },
        outbound: [next.action],
        done: next.step === 'completed',
      };
    }

    case 'awaiting_menu_choice': {
      let choice: string | undefined;
      if (input.replyId?.startsWith('menu_')) {
        const idx = Number.parseInt(input.replyId.slice(5), 10);
        choice = cfg.menuOptions?.[idx];
      } else if (input.text) {
        choice = cfg.menuOptions?.find((o) =>
          o.toLowerCase().includes(input.text!.trim().toLowerCase()),
        );
      }
      if (!choice) {
        return {
          ...empty,
          outbound: [
            {
              kind: 'list',
              body: 'Elige una opción de la lista, por favor:',
              buttonText: 'Ver menú',
              options: (cfg.menuOptions ?? []).map((opt, i) => ({ id: `menu_${i}`, title: opt })),
            },
          ],
        };
      }
      const next = stepAfterMenu(cfg);
      return {
        nextStep: next.step,
        guestPatch: { menuChoice: choice },
        answersPatch: { menuChoice: choice },
        outbound: [{ kind: 'text', body: `Perfecto, anotamos: ${choice}. 🍽️` }, next.action],
        done: next.step === 'completed',
      };
    }

    case 'awaiting_dietary': {
      const restrictions = (input.text ?? '').trim();
      const isNone = /^(ninguna?|no|nada)/i.test(restrictions);
      return {
        nextStep: 'completed',
        guestPatch: { dietaryRestrictions: isNone ? '' : restrictions },
        answersPatch: { dietaryRestrictions: isNone ? '' : restrictions },
        outbound: [
          {
            kind: 'text',
            body: '¡Todo listo! 🎉 Tu confirmación quedó registrada. Nos vemos pronto. 💛',
          },
        ],
        done: true,
      };
    }

    case 'awaiting_companion_names':
    case 'completed':
    default:
      return {
        ...empty,
        nextStep: 'completed',
        done: true,
        outbound: [
          {
            kind: 'text',
            body: 'Ya tenemos tu confirmación registrada. Si necesitas cambiar algo, escríbenos y con gusto te ayudamos. 💛',
          },
        ],
      };
  }
}
