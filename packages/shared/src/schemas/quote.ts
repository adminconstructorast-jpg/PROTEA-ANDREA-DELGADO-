import { z } from 'zod';
import {
  ALL_EVENT_SUBTYPES,
  BUDGET_RANGES,
  EVENT_TYPES,
  SERVICE_OPTIONS,
  isEventSubtypeOf,
} from '../constants.js';

/**
 * Esquema de validación del Formulario Dinámico de Cotización.
 * Se usa en el cliente (validación por paso) y en el servidor
 * (API route / Cloud Function) como única fuente de verdad.
 */

/**
 * Campos del paso 1. Se mantienen como objeto base (sin effects) porque
 * `quoteRequestSchema` los necesita para `.merge()`; la coherencia
 * tipo↔subtipo se aplica aparte con `refineEventSubtype`.
 */
const quoteStepEventFields = z.object({
  eventType: z.enum(EVENT_TYPES, {
    required_error: 'Cuéntanos qué tipo de evento sueñas',
  }),
  eventSubtype: z.enum(ALL_EVENT_SUBTYPES, {
    required_error: 'Elige la ocasión que celebrarás',
    invalid_type_error: 'Elige la ocasión que celebrarás',
  }),
});

/** El subtipo (si viene) debe pertenecer al tipo elegido. */
function refineEventSubtype(
  data: { eventType: (typeof EVENT_TYPES)[number]; eventSubtype?: string },
  ctx: z.RefinementCtx,
): void {
  if (data.eventSubtype && !isEventSubtypeOf(data.eventType, data.eventSubtype)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['eventSubtype'],
      message: 'La ocasión elegida no corresponde al tipo de evento',
    });
  }
}

/** Paso 1 del wizard: en el cliente la ocasión es obligatoria. */
export const quoteStepEventSchema = quoteStepEventFields.superRefine(refineEventSubtype);

export const quoteStepDateSchema = z
  .object({
    tentativeDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido')
      .nullable(),
    dateIsFlexible: z.boolean().default(false),
    guestCount: z.coerce
      .number({ invalid_type_error: 'Ingresa un número de invitados' })
      .int('Debe ser un número entero')
      .min(1, 'Debe haber al menos 1 invitado')
      .max(5000, 'Para eventos de más de 5,000 personas contáctanos directamente'),
  })
  .refine((data) => data.tentativeDate !== null || data.dateIsFlexible, {
    message: 'Selecciona una fecha tentativa o marca que aún es flexible',
    path: ['tentativeDate'],
  });

export const quoteStepVenueSchema = z
  .object({
    hasVenue: z.boolean(),
    venueName: z.string().trim().max(160).optional(),
    city: z.string().trim().max(120).optional(),
    budgetRange: z.enum(BUDGET_RANGES, {
      required_error: 'Selecciona un rango de presupuesto',
    }),
  })
  .refine((data) => !data.hasVenue || (data.venueName && data.venueName.length > 1), {
    message: 'Cuéntanos el nombre de tu venue',
    path: ['venueName'],
  });

export const quoteStepServicesSchema = z.object({
  services: z
    .array(z.enum(SERVICE_OPTIONS))
    .min(1, 'Selecciona al menos un servicio'),
  message: z.string().trim().max(2000).optional(),
});

export const quoteStepContactSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Ingresa tu nombre completo')
    .max(120),
  email: z.string().trim().email('Ingresa un correo válido').max(160),
  phone: z
    .string()
    .trim()
    .regex(
      /^\+?[0-9\s().-]{10,20}$/,
      'Ingresa un teléfono válido con lada (10 dígitos)',
    ),
  acceptsContact: z.literal(true, {
    errorMap: () => ({ message: 'Necesitamos tu autorización para contactarte' }),
  }),
});

/**
 * Payload completo que envía el cotizador al backend.
 * `eventSubtype` es OPCIONAL aquí (a diferencia del paso en el cliente) para
 * tolerar navegadores con el bundle web anterior y no depender del orden de
 * despliegue entre las funciones y el frontend.
 */
export const quoteRequestSchema = quoteStepEventFields
  .partial({ eventSubtype: true })
  .merge(quoteStepDateSchema.innerType())
  .merge(quoteStepVenueSchema.innerType())
  .merge(quoteStepServicesSchema)
  .merge(quoteStepContactSchema)
  .extend({
    utm: z
      .record(z.enum(['source', 'medium', 'campaign', 'term', 'content']), z.string().max(200))
      .optional(),
  })
  .superRefine(refineEventSubtype);

export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;

/** Pasos del wizard en orden, con su esquema para validación incremental. */
export const QUOTE_WIZARD_STEPS = [
  { key: 'event', title: 'Tu evento', schema: quoteStepEventSchema },
  { key: 'date', title: 'Fecha e invitados', schema: quoteStepDateSchema },
  { key: 'venue', title: 'Lugar y presupuesto', schema: quoteStepVenueSchema },
  { key: 'services', title: 'Servicios', schema: quoteStepServicesSchema },
  { key: 'contact', title: 'Tus datos', schema: quoteStepContactSchema },
] as const;

export type QuoteWizardStepKey = (typeof QUOTE_WIZARD_STEPS)[number]['key'];
