import type { InvoiceStatus, PaymentStatus } from '../constants.js';
import type { AuditFields, DocTimestamp, Money } from './common.js';

/**
 * Payment — Pago programado o recibido de un evento
 * (subcolección `events/{eventId}/payments`).
 */
export interface Payment extends AuditFields {
  id: string;
  eventId: string;
  concept: string; // "Anticipo", "Mensualidad 3/10", "Liquidación"…
  amount: Money;
  status: PaymentStatus;
  dueDate: DocTimestamp;
  paidAt?: DocTimestamp;
  method?: 'card' | 'transfer' | 'cash' | 'stripe_checkout';
  /** Id de la sesión/intent de la pasarela (Stripe). */
  gatewayRef?: string;
  /** URL de pago generada para el cliente. */
  checkoutUrl?: string;
  /** Factura vinculada, si se timbró. */
  invoiceId?: string;
  notes?: string;
}

/**
 * Invoice — Factura CFDI 4.0 (colección `invoices`).
 * El timbrado se realiza vía PAC en una Cloud Function; el cliente solo lee.
 */
export interface Invoice extends AuditFields {
  id: string;
  eventId: string;
  paymentId?: string;
  clientId: string;
  /** UID del cliente para las reglas de lectura. */
  clientUid?: string;
  status: InvoiceStatus;

  // ── Datos del comprobante ──
  series?: string;
  folio?: string;
  /** UUID fiscal asignado por el SAT al timbrar. */
  uuid?: string;
  issuedAt?: DocTimestamp;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  currency: 'MXN';
  /** Método de pago SAT: PUE (una exhibición) | PPD (parcialidades). */
  paymentMethod: 'PUE' | 'PPD';
  /** Forma de pago SAT (c_FormaPago): '03' transferencia, '04' TC… */
  paymentForm: string;
  /** Clave de producto/servicio SAT (c_ClaveProdServ), p. ej. '80141600'. */
  satProductCode: string;
  concepts: InvoiceConcept[];

  // ── Receptor ──
  receiver: {
    rfc: string;
    legalName: string;
    zipCode: string;
    taxRegime: string;
    cfdiUse: string;
    email: string;
  };

  // ── Resultado del PAC ──
  /** Rutas en Storage del XML timbrado y PDF. */
  xmlPath?: string;
  pdfPath?: string;
  /** Detalle del error si el timbrado falló. */
  error?: { code: string; message: string; at: DocTimestamp };
  /** Id interno del PAC (Facturama, Finkok, etc.). */
  pacRef?: string;
}

export interface InvoiceConcept {
  description: string;
  quantity: number;
  unitPriceCents: number;
  /** Clave unidad SAT (c_ClaveUnidad), p. ej. 'E48' (servicio). */
  unitCode: string;
  satProductCode: string;
}
