/**
 * PROTEA · Andrea Delgado — Punto de entrada de Cloud Functions.
 *
 * Se re-exportan las funciones agrupadas por módulo. Firebase despliega
 * cada export nombrado como una función independiente.
 */
import { setGlobalOptions } from 'firebase-functions/v2';
import { REGION } from './config.js';

setGlobalOptions({ region: REGION, maxInstances: 10 });

// ── Autenticación y roles ──
export { onUserCreate, setUserRole } from './auth/roles.js';

// ── CRM: leads y cotizaciones ──
export { submitQuoteRequest, onLeadCreated } from './crm/leads.js';

// ── CRM: invitados (importación masiva) ──
export { importGuests } from './crm/guests.js';

// ── WhatsApp Business ──
export { whatsappWebhook } from './whatsapp/webhook.js';
export { sendRsvpCampaign, scheduledRsvpReminders } from './whatsapp/campaigns.js';

// ── RSVP: agregación en tiempo real ──
export { onGuestWritten } from './rsvp/aggregate.js';

// ── Finanzas: pagos (Stripe) y facturación (CFDI 4.0) ──
export { createPaymentCheckout, stripeWebhook } from './finance/payments.js';
export { stampInvoice } from './finance/cfdi.js';

// ── Motor de IA (chatbot y generación de contenido) ──
export { chatWithAssistant, generateContent } from './ai/assistant.js';
