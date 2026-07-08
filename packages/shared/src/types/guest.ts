import type { RSVPStatus } from '../constants.js';
import type { AuditFields, DocTimestamp } from './common.js';

/**
 * Guest — Invitado de un evento (subcolección `events/{eventId}/guests`).
 *
 * El teléfono en E.164 es la llave de correlación con WhatsApp: el webhook
 * localiza al invitado por `phone` (índice de collection group) cuando llega
 * una respuesta.
 */
export interface Guest extends AuditFields {
  id: string;
  fullName: string;
  /** Teléfono en E.164 (+5215512345678). Llave de matching con WhatsApp. */
  phone: string;
  email?: string;
  /** Grupo/familia para agrupar en el seating (p. ej. "Familia Delgado"). */
  groupName?: string;
  /** Lado o afiliación: novia, novio, empresa, etc. */
  side?: string;
  /** Etiquetas libres (VIP, niño, staff…). */
  tags?: string[];

  // ── RSVP ──
  rsvpStatus: RSVPStatus;
  /** Número de lugares asignados a este invitado (él + acompañantes máximos). */
  seatsAllocated: number;
  /** Acompañantes confirmados por el invitado en el flujo de WhatsApp. */
  companionsConfirmed?: number;
  /** Nombres de los acompañantes, si los proporcionó. */
  companionNames?: string[];
  /** Restricciones alimentarias reportadas. */
  dietaryRestrictions?: string;
  /** Opción de menú elegida. */
  menuChoice?: string;
  /** Momento de la última respuesta del invitado. */
  respondedAt?: DocTimestamp;

  // ── Estado de mensajería WhatsApp ──
  whatsapp: GuestWhatsAppState;

  // ── Seating ──
  /** Mesa asignada (id de `events/{eventId}/tables`). */
  tableId?: string | null;
  seatNumber?: number | null;

  /** Campo desnormalizado para queries de collection group. */
  eventId: string;
  /** Origen del registro. */
  source: 'import_csv' | 'import_xlsx' | 'manual' | 'portal';
}

/** Estado de entrega de mensajes de WhatsApp por invitado. */
export interface GuestWhatsAppState {
  /** ¿El número resultó válido/alcanzable en WhatsApp? */
  reachable?: boolean;
  saveTheDateSentAt?: DocTimestamp;
  invitationSentAt?: DocTimestamp;
  lastReminderSentAt?: DocTimestamp;
  remindersSent: number;
  /** wamid del último mensaje enviado (para correlacionar statuses). */
  lastOutboundMessageId?: string;
  lastDeliveryStatus?: 'sent' | 'delivered' | 'read' | 'failed';
  /** Falla registrada por la API (número inválido, bloqueo, etc.). */
  lastError?: string;
}

/** Mesa del seating planner (subcolección `events/{eventId}/tables`). */
export interface SeatingTable extends AuditFields {
  id: string;
  name: string;
  shape: 'round' | 'rectangular' | 'imperial';
  capacity: number;
  /** Posición en el lienzo del planner (coordenadas relativas 0–1). */
  x: number;
  y: number;
  rotation?: number;
  notes?: string;
}

/**
 * Conversación activa de RSVP por WhatsApp (colección `waConversations`).
 * Documento id = número E.164 sin '+'. Guarda el paso del flujo conversacional
 * para que el webhook sepa qué pregunta sigue.
 */
export interface WAConversation {
  /** Teléfono E.164 sin '+' (igual que wa_id de Meta). */
  id: string;
  eventId: string;
  guestId: string;
  /** Paso actual del flujo conversacional. */
  step: RSVPFlowStep;
  /** Respuestas acumuladas durante el flujo. */
  answers: {
    attending?: boolean;
    companions?: number;
    companionNames?: string[];
    dietaryRestrictions?: string;
    menuChoice?: string;
  };
  startedAt: DocTimestamp;
  updatedAt: DocTimestamp;
  /** La conversación expira a las 24h (ventana de WhatsApp). */
  expiresAt: DocTimestamp;
}

export const RSVP_FLOW_STEPS = [
  'awaiting_confirmation', // se envió la invitación con botones
  'awaiting_companions', // preguntamos cuántos acompañantes
  'awaiting_companion_names',
  'awaiting_menu_choice',
  'awaiting_dietary',
  'completed',
] as const;
export type RSVPFlowStep = (typeof RSVP_FLOW_STEPS)[number];

/** Log inmutable de mensajes de WhatsApp (colección `waMessages`). */
export interface WAMessageLog {
  id: string; // wamid
  direction: 'inbound' | 'outbound';
  phone: string;
  eventId?: string;
  guestId?: string;
  type: string; // text | interactive | template | status...
  payload: unknown;
  createdAt: DocTimestamp;
}
