import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  REGION,
  APP_CHECK_ENFORCE,
} from '../config.js';
import { db, storage } from '../lib/admin.js';
import {
  COLLECTIONS,
  SERVICE_LABELS,
  BUDGET_RANGE_LABELS,
  eventDisplayLabel,
  type Lead,
} from '../shared.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Descripciones de soporte para los servicios en la cotización
const SERVICE_DESCRIPTIONS: Record<string, string> = {
  full_planning: 'Coordinación, planeación y conceptualización integral de todo el evento desde el primer día, asesoría en selección de locaciones y control financiero.',
  partial_planning: 'Asesoría a mitad del camino para consolidar contrataciones pendientes, revisar diseño y supervisar el cronograma maestro.',
  day_coordination: 'Supervisión minuciosa y coordinación operativa de proveedores en el montaje, transcurso y desmontaje del gran día.',
  floral_design: 'Dirección artística y producción floral personalizada para ceremonia, banquete, boutonnières y ramos de novia.',
  decor_styling: 'Conceptualización de diseño de interiores, estilismo de mesas, selección de mobiliario, mantelería y ambientación de áreas comunes.',
  lighting: 'Diseño e iluminación ambiental y arquitectónica del recinto para crear una atmósfera cálida y dramática.',
  sound_music: 'Equipo de audio premium, musicalización para momentos clave, DJ profesional y soporte de microfonía para discursos.',
  photography: 'Documentación fotográfica profesional en alta resolución, pre-boda y cobertura total el día del evento.',
  videography: 'Grabación de video cinemático, tomas aéreas con drone, video resumen (teaser) y entrega de video documental.',
  live_band: 'Propuestas de grupos y ensambles musicales en vivo de primer nivel para amenizar el coctel, cena o fiesta.',
  catering: 'Experiencia gastronómica personalizada que incluye banquete de varios tiempos, mixología de autor y servicio de personal.',
  transport: 'Logística, renta de vehículos ejecutivos y transportación coordinada para novios, familia e invitados.',
};

function getServiceDescription(serviceKey: string): string {
  return SERVICE_DESCRIPTIONS[serviceKey] || 'Servicio de diseño y coordinación personalizada adaptada al evento.';
}

export const generateQuotePdf = onCall({
  region: REGION,
  memory: '2GiB', // Mayor RAM requerida para iniciar Chromium headless
}, async (request) => {
  // Verificación de App Check (sigue la política de flexibilización por APP_CHECK_ENFORCE)
  if (APP_CHECK_ENFORCE.value() === 'true' && !request.app) {
    logger.warn('App Check bloqueó la generación de PDF por token ausente');
    throw new HttpsError('failed-precondition', 'Solicitud no verificada.');
  }

  const { leadId } = request.data as { leadId?: string };
  if (!leadId) {
    throw new HttpsError('invalid-argument', 'El parámetro leadId es requerido.');
  }

  logger.info(`Iniciando generación de PDF para el Lead: ${leadId}`);

  try {
    // 1. Obtener información del Lead desde Firestore
    const leadDoc = await db.collection(COLLECTIONS.LEADS).doc(leadId).get();
    if (!leadDoc.exists) {
      throw new HttpsError('not-found', 'El prospecto no existe en Firestore.');
    }

    const lead = { id: leadDoc.id, ...leadDoc.data() } as Lead;
    const { contact, eventType, eventSubtype, tentativeDate, guestCount, hasVenue, venueName, city, budgetRange, services, message } = lead;

    // 2. Cargar la plantilla HTML
    const templatePath = path.join(__dirname, '../../../../src/templates/quote-template.html');
    let htmlContent = await fs.readFile(templatePath, 'utf-8');

    // 3. Formatear y mapear los datos para el reemplazo
    const formattedDate = tentativeDate || 'Flexible / Pendiente de definir';
    const venueLabel = hasVenue 
      ? `${venueName || 'Venue Confirmado'}` 
      : 'Buscando locación';
    const cityLabel = city ? `${city}` : 'Pendiente de definir';
    const displayType = eventDisplayLabel(eventType, eventSubtype);
    const budgetLabel = BUDGET_RANGE_LABELS[budgetRange] || 'Pendiente de definir';
    const dateGenerated = new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Construcción de la tabla de servicios en HTML
    let servicesTableHtml = '';
    if (services && services.length > 0) {
      servicesTableHtml = services.map((srv) => {
        const label = SERVICE_LABELS[srv] || srv;
        const desc = getServiceDescription(srv);
        return `
          <tr>
            <td style="font-weight: 500; color: #1c1a17;">${label}</td>
            <td>${desc}</td>
          </tr>
        `;
      }).join('');
    } else {
      servicesTableHtml = `
        <tr>
          <td colspan="2" style="text-align: center; color: #8b8377;">No se han seleccionado servicios específicos en la solicitud.</td>
        </tr>
      `;
    }

    // Caja de mensaje del cliente (si existe)
    let messageBoxHtml = '';
    if (message && message.trim().length > 0) {
      messageBoxHtml = `
        <div class="message-box">
          <div class="message-title">Mensaje de Inspiración o Notas del Cliente</div>
          "${message}"
        </div>
      `;
    }

    // Reemplazos de placeholders
    htmlContent = htmlContent
      .replace(/{{cotizacionId}}/g, leadId.substring(0, 8).toUpperCase())
      .replace(/{{fechaEmision}}/g, dateGenerated)
      .replace(/{{nombre}}/g, contact.fullName)
      .replace(/{{email}}/g, contact.email)
      .replace(/{{telefono}}/g, contact.phone)
      .replace(/{{tipoEvento}}/g, displayType)
      .replace(/{{fechaEvento}}/g, formattedDate)
      .replace(/{{invitados}}/g, String(guestCount))
      .replace(/{{lugar}}/g, `${venueLabel} (${cityLabel})`)
      .replace(/{{presupuesto}}/g, budgetLabel)
      .replace(/{{tablaServicios}}/g, servicesTableHtml)
      .replace(/{{mensajeBox}}/g, messageBoxHtml);

    // 4. Renderizar el PDF usando Puppeteer Headless Chromium
    logger.info('Iniciando Puppeteer headless browser...');
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' as any });
    
    // Generar buffer
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm',
      }
    });

    await browser.close();
    logger.info('Puppeteer PDF generado con éxito.');

    // 5. Subir a Firebase Storage
    const bucket = storage.bucket();
    const filePath = `quotes/${leadId}_cotizacion.pdf`;
    const fileRef = bucket.file(filePath);

    logger.info(`Subiendo PDF a Firebase Storage: ${filePath}`);
    await fileRef.save(pdfBuffer, {
      contentType: 'application/pdf',
      metadata: {
        metadata: {
          leadId: leadId,
          generator: 'generateQuotePdf',
        }
      }
    });

    // 6. Obtener URL de descarga firmada (Signed URL) que expire en 7 días
    logger.info('Generando Signed URL...');
    const [downloadUrl] = await fileRef.getSignedUrl({
      action: 'read',
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 días
    });

    logger.info(`PDF de cotización generado y disponible para el Lead: ${leadId}`);
    return {
      success: true,
      url: downloadUrl,
      fileName: `${leadId}_cotizacion.pdf`
    };

  } catch (error: any) {
    logger.error('Error crítico en generateQuotePdf:', {
      message: error.message,
      stack: error.stack
    });
    throw new HttpsError('internal', `Error en la generación del PDF: ${error.message}`);
  }
});
