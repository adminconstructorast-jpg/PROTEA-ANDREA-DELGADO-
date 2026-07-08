import type {
  BudgetRange,
  EventType,
  LeadStatus,
  ServiceOption,
} from '../constants.js';
import type { AuditFields, ContactInfo, DocTimestamp } from './common.js';

/**
 * Lead / QuoteRequest — Prospecto creado por el Formulario Dinámico de
 * Cotización del sitio público. Documento raíz de la colección `leads`.
 */
export interface Lead extends AuditFields {
  id: string;
  contact: ContactInfo;

  // ── Datos capturados por el cotizador multi-step ──
  eventType: EventType;
  /** Fecha tentativa del evento (ISO yyyy-mm-dd); puede ser null si no la saben. */
  tentativeDate: string | null;
  /** ¿La fecha es flexible? */
  dateIsFlexible: boolean;
  guestCount: number;
  /** ¿Ya cuentan con locación/venue? */
  hasVenue: boolean;
  /** Nombre o ciudad del venue si ya lo tienen. */
  venueName?: string;
  city?: string;
  budgetRange: BudgetRange;
  /** Checklist de servicios deseados. */
  services: ServiceOption[];
  /** Mensaje libre del prospecto. */
  message?: string;

  // ── Gestión CRM ──
  status: LeadStatus;
  /** Puntaje 0–100 calculado por Cloud Function según presupuesto/servicios. */
  score?: number;
  /** UID del miembro del equipo asignado. */
  assignedTo?: string;
  /** Notas internas de seguimiento. */
  notes?: LeadNote[];
  /** Origen del lead. */
  source: 'web_quote_form' | 'instagram' | 'referral' | 'whatsapp' | 'manual';
  /** Parámetros UTM para atribución de marketing. */
  utm?: Partial<Record<'source' | 'medium' | 'campaign' | 'term' | 'content', string>>;
  /** Fecha de la próxima acción de seguimiento. */
  nextFollowUpAt?: DocTimestamp;
  /** Si el lead se convirtió, referencia al evento creado. */
  convertedEventId?: string;
}

export interface LeadNote {
  authorUid: string;
  text: string;
  createdAt: DocTimestamp;
}

/** Cotización formal generada desde un lead (colección `quotes`). */
export interface Quote extends AuditFields {
  id: string;
  leadId: string;
  clientUid?: string;
  title: string;
  lineItems: QuoteLineItem[];
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  currency: 'MXN' | 'USD';
  validUntil: DocTimestamp;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  /** Ruta en Storage del PDF generado. */
  pdfPath?: string;
}

export interface QuoteLineItem {
  concept: string;
  description?: string;
  quantity: number;
  unitPriceCents: number;
}
