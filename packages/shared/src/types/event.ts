import type { EventStatus, EventType, ServiceOption } from '../constants.js';
import type { AuditFields, DocTimestamp, Money } from './common.js';

/**
 * Event — Evento contratado (colección `events`).
 * Los clientes (novios/anfitriones) acceden vía `memberUids`.
 */
export interface EventDoc extends AuditFields {
  id: string;
  name: string;
  type: EventType;
  status: EventStatus;
  /** Fecha y hora del evento. */
  date: DocTimestamp;
  venue?: VenueInfo;
  city?: string;
  expectedGuests: number;
  services: ServiceOption[];
  /** UIDs de los clientes con acceso al portal (novios/anfitriones). */
  memberUids: string[];
  /** Referencia al cliente principal (colección `clients`). */
  clientId: string;
  /** Lead de origen, si aplica. */
  leadId?: string;
  /** Presupuesto total contratado. */
  contractTotal: Money;
  /** Porcentaje de avance de planeación (0–100), calculado de las tareas. */
  progressPercent: number;
  /** Carpeta de Google Drive vinculada a este evento. */
  driveFolderId?: string;
  /** Hoja de cálculo de Google Sheets vinculada (presupuesto/planeación). */
  sheetId?: string;
  /** Configuración de RSVP por WhatsApp. */
  rsvp: RSVPConfig;
  coverImageUrl?: string;
}

export interface VenueInfo {
  name: string;
  address?: string;
  mapsUrl?: string;
}

export interface RSVPConfig {
  enabled: boolean;
  /** Nombre de la plantilla aprobada de WhatsApp para la invitación. */
  invitationTemplate?: string;
  /** Nombre de la plantilla para save-the-date. */
  saveTheDateTemplate?: string;
  /** Nombre de la plantilla para recordatorios. */
  reminderTemplate?: string;
  /** Días antes del evento para enviar recordatorios a pendientes. */
  reminderDaysBefore: number[];
  /** ¿Preguntar restricciones alimentarias en el flujo conversacional? */
  askDietaryRestrictions: boolean;
  /** ¿Preguntar opción de menú? */
  askMenuChoice: boolean;
  /** Opciones de menú disponibles. */
  menuOptions?: string[];
  /** ¿Permitir confirmación de acompañantes (+1s)? */
  askCompanions: boolean;
  /** Fecha límite para confirmar. */
  deadline?: DocTimestamp;
}

/** Elemento del itinerario del evento (subcolección `timeline`). */
export interface TimelineItem extends AuditFields {
  id: string;
  time: DocTimestamp;
  title: string;
  description?: string;
  responsible?: string;
  vendorId?: string;
  order: number;
}

/** Tarea operativa (subcolección `tasks`). */
export interface EventTask extends AuditFields {
  id: string;
  title: string;
  description?: string;
  dueDate?: DocTimestamp;
  assigneeUid?: string;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  /** Si true, el cliente la ve en su portal como hito de progreso. */
  visibleToClient: boolean;
}

/** Línea de presupuesto interno (subcolección `budget`). */
export interface BudgetLine extends AuditFields {
  id: string;
  category: string;
  concept: string;
  vendorId?: string;
  estimated: Money;
  actual?: Money;
  paidCents: number;
  notes?: string;
}

/** Proveedor del catálogo del negocio (colección `vendors`). */
export interface Vendor extends AuditFields {
  id: string;
  name: string;
  category: string;
  contactName?: string;
  phone?: string;
  email?: string;
  priceRange?: string;
  rating?: number;
  notes?: string;
  active: boolean;
}
