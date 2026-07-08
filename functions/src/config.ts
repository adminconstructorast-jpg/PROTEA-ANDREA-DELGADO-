import { defineSecret, defineString } from 'firebase-functions/params';

/**
 * Configuración de la plataforma vía parámetros de Firebase.
 * Secretos: `firebase functions:secrets:set NOMBRE`
 * Strings:  variables de entorno del deploy o `.env.<project>`.
 */

// ── Negocio ──────────────────────────────────────────────────────────────────
export const PLANNER_EMAIL = defineString('PLANNER_EMAIL', {
  description: 'Correo de la planner para notificaciones de nuevos leads',
  default: 'hola@proteaeventos.mx',
});
export const PLANNER_PHONE = defineString('PLANNER_PHONE', {
  description: 'WhatsApp de la planner en E.164 (+52...)',
  default: '',
});
/** Correos que reciben rol `planner` automáticamente al registrarse. */
export const PLANNER_ADMIN_EMAILS = defineString('PLANNER_ADMIN_EMAILS', {
  description: 'Lista separada por comas de correos con rol planner',
  default: '',
});

// ── WhatsApp Business (Meta Graph API) ───────────────────────────────────────
export const WHATSAPP_TOKEN = defineSecret('WHATSAPP_TOKEN');
export const WHATSAPP_APP_SECRET = defineSecret('WHATSAPP_APP_SECRET');
export const WHATSAPP_VERIFY_TOKEN = defineSecret('WHATSAPP_VERIFY_TOKEN');
export const WHATSAPP_PHONE_NUMBER_ID = defineString('WHATSAPP_PHONE_NUMBER_ID', {
  description: 'Phone Number ID del número de WhatsApp Business',
  default: '',
});
export const GRAPH_API_VERSION = 'v21.0';

// ── IA (Anthropic) ───────────────────────────────────────────────────────────
export const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');
/** Modelo por defecto para el chatbot y el motor de contenido. */
export const AI_MODEL = 'claude-opus-4-8';

// ── Pagos (Stripe) ───────────────────────────────────────────────────────────
export const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
export const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');

// ── Facturación CFDI 4.0 (PAC) ───────────────────────────────────────────────
export const PAC_API_KEY = defineSecret('PAC_API_KEY');
export const PAC_BASE_URL = defineString('PAC_BASE_URL', {
  description: 'URL base del PAC (p. ej. https://api.facturama.mx)',
  default: 'https://apisandbox.facturama.mx',
});
/** RFC y datos del emisor (Andrea Delgado / razón social). */
export const CFDI_ISSUER_RFC = defineString('CFDI_ISSUER_RFC', { default: '' });
export const CFDI_ISSUER_NAME = defineString('CFDI_ISSUER_NAME', { default: '' });
export const CFDI_ISSUER_TAX_REGIME = defineString('CFDI_ISSUER_TAX_REGIME', {
  description: 'Régimen fiscal del emisor (c_RegimenFiscal, p. ej. 612)',
  default: '612',
});
export const CFDI_EXPEDITION_ZIP = defineString('CFDI_EXPEDITION_ZIP', {
  description: 'Código postal de expedición (LugarExpedicion)',
  default: '',
});

// ── Región por defecto de las funciones ──────────────────────────────────────
export const REGION = 'us-central1';
