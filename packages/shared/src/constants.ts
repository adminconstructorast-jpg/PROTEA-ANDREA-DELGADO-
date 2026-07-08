/**
 * Constantes globales de la plataforma PROTEA.
 * Única fuente de verdad para nombres de colecciones, roles y enums.
 */

/** Nombres de colecciones de Firestore. */
export const COLLECTIONS = {
  USERS: 'users',
  LEADS: 'leads',
  QUOTES: 'quotes',
  CLIENTS: 'clients',
  EVENTS: 'events',
  GUESTS: 'guests', // subcolección de events
  TABLES: 'tables', // subcolección de events (seating)
  TIMELINE: 'timeline', // subcolección de events
  TASKS: 'tasks', // subcolección de events
  BUDGET: 'budget', // subcolección de events
  PAYMENTS: 'payments', // subcolección de events
  VENDORS: 'vendors',
  INVOICES: 'invoices',
  FAQ: 'faq',
  SETTINGS: 'settings',
  MAIL: 'mail',
  WA_CONVERSATIONS: 'waConversations',
  WA_MESSAGES: 'waMessages',
  AI_SESSIONS: 'aiSessions',
} as const;

/** Roles de usuario (custom claims de Firebase Auth). */
export const USER_ROLES = ['planner', 'staff', 'client'] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Tipos de evento soportados por el cotizador y el CRM. */
export const EVENT_TYPES = ['wedding', 'corporate', 'social'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  wedding: 'Boda',
  corporate: 'Evento corporativo',
  social: 'Evento social',
};

/** Etapas del pipeline de ventas (CRM). */
export const LEAD_STATUSES = [
  'new',
  'contacted',
  'meeting_scheduled',
  'quote_sent',
  'negotiation',
  'won',
  'lost',
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  meeting_scheduled: 'Cita agendada',
  quote_sent: 'Cotización enviada',
  negotiation: 'Negociación',
  won: 'Ganado',
  lost: 'Perdido',
};

/** Estado de RSVP de cada invitado. */
export const RSVP_STATUSES = ['pending', 'invited', 'confirmed', 'declined', 'no_response'] as const;
export type RSVPStatus = (typeof RSVP_STATUSES)[number];

export const RSVP_STATUS_LABELS: Record<RSVPStatus, string> = {
  pending: 'Pendiente de invitar',
  invited: 'Invitación enviada',
  confirmed: 'Confirmado',
  declined: 'No asistirá',
  no_response: 'Sin respuesta',
};

/** Ciclo de vida de un evento contratado. */
export const EVENT_STATUSES = [
  'planning',
  'in_progress',
  'completed',
  'cancelled',
] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

/** Servicios contratables (checklist del cotizador). */
export const SERVICE_OPTIONS = [
  'full_planning',
  'partial_planning',
  'day_coordination',
  'catering',
  'floral_design',
  'dj_music',
  'live_band',
  'furniture_rental',
  'photography',
  'video',
  'lighting',
  'stationery',
  'transport',
  'guest_management',
] as const;
export type ServiceOption = (typeof SERVICE_OPTIONS)[number];

export const SERVICE_LABELS: Record<ServiceOption, string> = {
  full_planning: 'Planeación integral',
  partial_planning: 'Planeación parcial',
  day_coordination: 'Coordinación del día',
  catering: 'Catering / Banquete',
  floral_design: 'Diseño floral',
  dj_music: 'DJ',
  live_band: 'Música en vivo',
  furniture_rental: 'Mobiliario',
  photography: 'Fotografía',
  video: 'Video',
  lighting: 'Iluminación',
  stationery: 'Papelería e invitaciones',
  transport: 'Transporte',
  guest_management: 'Gestión de invitados (RSVP)',
};

/** Rangos de presupuesto (MXN) para el cotizador. */
export const BUDGET_RANGES = [
  'under_150k',
  '150k_300k',
  '300k_600k',
  '600k_1m',
  'over_1m',
  'undefined',
] as const;
export type BudgetRange = (typeof BUDGET_RANGES)[number];

export const BUDGET_RANGE_LABELS: Record<BudgetRange, string> = {
  under_150k: 'Menos de $150,000 MXN',
  '150k_300k': '$150,000 – $300,000 MXN',
  '300k_600k': '$300,000 – $600,000 MXN',
  '600k_1m': '$600,000 – $1,000,000 MXN',
  over_1m: 'Más de $1,000,000 MXN',
  undefined: 'Aún no lo defino',
};

/** Estados de pago. */
export const PAYMENT_STATUSES = ['pending', 'processing', 'paid', 'overdue', 'refunded', 'cancelled'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Estados del ciclo de timbrado CFDI 4.0. */
export const INVOICE_STATUSES = ['draft', 'stamping', 'stamped', 'error', 'cancelled'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
