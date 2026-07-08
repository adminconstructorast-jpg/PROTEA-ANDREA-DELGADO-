import Anthropic from '@anthropic-ai/sdk';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { REGION, ANTHROPIC_API_KEY, AI_MODEL } from '../config.js';
import { db } from '../lib/admin.js';
import { COLLECTIONS } from '../shared.js';

/**
 * Motor de IA de PROTEA sobre la API de Anthropic (Claude).
 *  - Chatbot público entrenado con el FAQ de la planner.
 *  - Generación de contenido: copys de Instagram, ideas de diseño e itinerarios.
 *
 * Se usa streaming vía SDK y se controla el gasto con `output_config.effort`.
 */

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() });
  }
  return client;
}

/** Carga el FAQ desde Firestore para fundamentar (ground) el chatbot. */
async function loadFaqContext(): Promise<string> {
  const snap = await db.collection(COLLECTIONS.FAQ).limit(50).get();
  if (snap.empty) return 'Aún no hay preguntas frecuentes cargadas.';
  return snap.docs
    .map((d) => {
      const data = d.data() as { question?: string; answer?: string };
      return `P: ${data.question ?? ''}\nR: ${data.answer ?? ''}`;
    })
    .join('\n\n');
}

const BRAND_VOICE = `Eres el asistente virtual de PROTEA, la firma de Andrea Delgado, wedding & event planner de alto perfil en México.
Tu tono es cálido, elegante, cercano y profesional. Hablas en español de México.
Ayudas a prospectos y clientes con dudas sobre servicios, proceso, fechas y logística de eventos.
Si no sabes algo o requiere cotización personalizada, invita amablemente a dejar sus datos en el cotizador o a contactar directamente a Andrea.
Nunca inventes precios exactos ni compromisos de disponibilidad; ofrece rangos o remite a una cita.`;

/**
 * Callable: chatbot conversacional para el sitio público.
 * Recibe el historial breve y devuelve la respuesta del asistente.
 */
export const chatWithAssistant = onCall(
  { region: REGION, secrets: [ANTHROPIC_API_KEY] },
  async (request) => {
    const { messages } = request.data as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    };
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new HttpsError('invalid-argument', 'Se requiere un historial de mensajes.');
    }
    // Limitar tamaño del historial para controlar costo/latencia.
    const trimmed = messages.slice(-12);

    const faq = await loadFaqContext();

    try {
      const response = await getClient().messages.create({
        model: AI_MODEL,
        max_tokens: 1024,
        system: [
          { type: 'text', text: BRAND_VOICE },
          {
            type: 'text',
            text: `Preguntas frecuentes de referencia:\n\n${faq}`,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: trimmed.map((m) => ({ role: m.role, content: m.content })),
      });

      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n');

      return { reply: text, stopReason: response.stop_reason };
    } catch (err) {
      logger.error('Error en chatWithAssistant', err);
      throw new HttpsError('internal', 'El asistente no está disponible en este momento.');
    }
  },
);

type ContentKind = 'instagram_caption' | 'design_ideas' | 'itinerary_draft';

const CONTENT_PROMPTS: Record<ContentKind, (brief: string) => string> = {
  instagram_caption: (brief) =>
    `Escribe 3 opciones de copy para Instagram para PROTEA sobre: "${brief}". ` +
    `Cada opción con un gancho inicial, cuerpo breve y llamada a la acción. ` +
    `Incluye 8-12 hashtags relevantes de bodas y eventos en México al final de cada opción. ` +
    `Tono elegante y aspiracional.`,
  design_ideas: (brief) =>
    `Genera un moodboard conceptual en texto para: "${brief}". ` +
    `Incluye paleta de colores (con nombres y códigos hex), estilo floral, iluminación, ` +
    `mobiliario, papelería y 3 detalles diferenciadores. Formato con encabezados claros.`,
  itinerary_draft: (brief) =>
    `Crea un borrador de itinerario (timeline) para: "${brief}". ` +
    `Organiza por bloques horarios con hora, actividad y responsable sugerido. ` +
    `Considera montaje, recepción, ceremonia, banquete, fiesta y desmontaje según aplique.`,
};

/**
 * Callable (solo staff): motor de generación de contenido.
 * Genera copys de Instagram, ideas de diseño o borradores de itinerario.
 */
export const generateContent = onCall(
  { region: REGION, secrets: [ANTHROPIC_API_KEY] },
  async (request) => {
    const role = (request.auth?.token as Record<string, unknown> | undefined)?.role;
    if (role !== 'planner' && role !== 'staff') {
      throw new HttpsError('permission-denied', 'Requiere rol planner o staff.');
    }

    const { kind, brief } = request.data as { kind: ContentKind; brief: string };
    const promptBuilder = CONTENT_PROMPTS[kind];
    if (!promptBuilder || !brief?.trim()) {
      throw new HttpsError('invalid-argument', 'kind y brief válidos son obligatorios.');
    }

    try {
      const response = await getClient().messages.create({
        model: AI_MODEL,
        max_tokens: 2048,
        system: BRAND_VOICE,
        messages: [{ role: 'user', content: promptBuilder(brief) }],
      });

      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n');

      return { content: text };
    } catch (err) {
      logger.error('Error en generateContent', err);
      throw new HttpsError('internal', 'No se pudo generar el contenido.');
    }
  },
);
