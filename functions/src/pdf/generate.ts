import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import PDFDocument from 'pdfkit';
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

function createPdfBuffer(lead: Lead): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        bufferPages: true,
      });
      const chunks: Buffer[] = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', err => reject(err));

      // ── ENCABEZADO ──
      // Dibujar Marca
      doc.fillColor('#b08968')
         .fontSize(22)
         .font('Helvetica-Bold')
         .text('ANDREA DELGADO', 40, 45, { characterSpacing: 2 });
         
      doc.fillColor('#1c1a17')
         .fontSize(7.5)
         .font('Helvetica')
         .text('WEDDING & EVENT PLANNER', 40, 72, { characterSpacing: 3 });

      // Datos de Cotización (a la derecha)
      const dateGenerated = new Date().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      doc.fillColor('#1c1a17')
         .fontSize(13)
         .font('Helvetica-Bold')
         .text('ESTIMACIÓN DE EVENTO', 320, 45, { align: 'right' });

      doc.fillColor('#6a645a')
         .fontSize(8)
         .font('Helvetica')
         .text(`Ref: #${lead.id.substring(0, 8).toUpperCase()}`, 320, 62, { align: 'right' })
         .text(`Fecha Emisión: ${dateGenerated}`, 320, 74, { align: 'right' });

      // Línea divisoria
      doc.moveTo(40, 95)
         .lineTo(555, 95)
         .strokeColor('#e5dfd5')
         .lineWidth(1)
         .stroke();

      // ── CUADRÍCULA DE INFORMACIÓN ──
      // Sección de la izquierda (Contacto)
      doc.fillColor('#fcfbfa')
         .rect(40, 115, 245, 110)
         .fill()
         .strokeColor('#f2ede4')
         .lineWidth(1)
         .stroke();

      doc.fillColor('#b08968')
         .fontSize(9)
         .font('Helvetica-Bold')
         .text('CONTACTO', 55, 130);

      doc.moveTo(55, 143).lineTo(270, 143).strokeColor('#e5dfd5').stroke();

      doc.fillColor('#6a645a').fontSize(8.5).font('Helvetica-Bold').text('Nombre: ', 55, 155);
      doc.fillColor('#1c1a17').font('Helvetica').text(lead.contact.fullName, 115, 155);

      doc.fillColor('#6a645a').font('Helvetica-Bold').text('Email: ', 55, 175);
      doc.fillColor('#1c1a17').font('Helvetica').text(lead.contact.email, 115, 175);

      doc.fillColor('#6a645a').font('Helvetica-Bold').text('Teléfono: ', 55, 195);
      doc.fillColor('#1c1a17').font('Helvetica').text(lead.contact.phone, 115, 195);

      // Sección de la derecha (Detalles del Evento)
      doc.fillColor('#fcfbfa')
         .rect(310, 115, 245, 110)
         .fill()
         .strokeColor('#f2ede4')
         .lineWidth(1)
         .stroke();

      doc.fillColor('#b08968')
         .fontSize(9)
         .font('Helvetica-Bold')
         .text('DETALLES DEL EVENTO', 325, 130);

      doc.moveTo(325, 143).lineTo(540, 143).strokeColor('#e5dfd5').stroke();

      const displayType = eventDisplayLabel(lead.eventType, lead.eventSubtype);
      doc.fillColor('#6a645a').fontSize(8.5).font('Helvetica-Bold').text('Tipo: ', 325, 155);
      doc.fillColor('#1c1a17').font('Helvetica').text(displayType, 395, 155);

      doc.fillColor('#6a645a').font('Helvetica-Bold').text('Fecha: ', 325, 170);
      doc.fillColor('#1c1a17').font('Helvetica').text(lead.tentativeDate || 'Flexible / Pendiente', 395, 170);

      doc.fillColor('#6a645a').font('Helvetica-Bold').text('Invitados: ', 325, 185);
      doc.fillColor('#1c1a17').font('Helvetica').text(`${lead.guestCount} pax`, 395, 185);

      const venueLabel = lead.hasVenue ? (lead.venueName || 'Venue Confirmado') : 'Buscando locación';
      doc.fillColor('#6a645a').font('Helvetica-Bold').text('Lugar: ', 325, 200);
      doc.fillColor('#1c1a17').font('Helvetica').text(`${venueLabel} (${lead.city || 'N/D'})`, 395, 200);

      // ── PROPUESTA DE SERVICIOS (TABLA DIBUJADA) ──
      doc.fillColor('#1c1a17')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('PROPUESTA DE SERVICIOS', 40, 250);

      doc.moveTo(40, 263)
         .lineTo(555, 263)
         .strokeColor('#b08968')
         .lineWidth(2)
         .stroke();

      // Encabezados de la Tabla
      doc.fillColor('#f5f2eb')
         .rect(40, 270, 515, 22)
         .fill();

      doc.fillColor('#1c1a17')
         .fontSize(8.5)
         .font('Helvetica-Bold')
         .text('SERVICIO REQUERIDO', 50, 277)
         .text('DESCRIPCIÓN GENERAL / ALCANCE SUGERIDO', 220, 277);

      // Filas de la Tabla
      let currentY = 295;
      const rowHeight = 42;

      if (lead.services && lead.services.length > 0) {
        lead.services.forEach((srv) => {
          if (currentY + rowHeight > 730) {
            doc.addPage();
            currentY = 50;
            // Volver a dibujar cabeceras en nueva página
            doc.fillColor('#f5f2eb')
               .rect(40, currentY, 515, 22)
               .fill();
            doc.fillColor('#1c1a17')
               .fontSize(8.5)
               .font('Helvetica-Bold')
               .text('SERVICIO REQUERIDO', 50, currentY + 7)
               .text('DESCRIPCIÓN GENERAL / ALCANCE SUGERIDO', 220, currentY + 7);
            currentY += 25;
          }

          const label = SERVICE_LABELS[srv] || srv;
          const desc = getServiceDescription(srv);

          doc.fillColor('#1c1a17')
             .fontSize(8.5)
             .font('Helvetica-Bold')
             .text(label, 50, currentY + 5, { width: 160 });

          doc.fillColor('#3a3732')
             .font('Helvetica')
             .fontSize(8)
             .text(desc, 220, currentY + 5, { width: 325, align: 'justify' });

          doc.moveTo(40, currentY + rowHeight - 2)
             .lineTo(555, currentY + rowHeight - 2)
             .strokeColor('#f2ede4')
             .lineWidth(1)
             .stroke();

          currentY += rowHeight;
        });
      } else {
        doc.fillColor('#8b8377')
           .font('Helvetica')
           .fontSize(9)
           .text('No se han seleccionado servicios específicos en la solicitud.', 40, currentY + 10, { align: 'center' });
        currentY += 30;
      }

      // ── NOTAS DEL CLIENTE (MENSAJE) ──
      if (lead.message && lead.message.trim().length > 0) {
        if (currentY + 60 > 730) {
          doc.addPage();
          currentY = 50;
        }

        doc.fillColor('#fcfbfa')
           .rect(40, currentY + 10, 515, 50)
           .fill()
           .strokeColor('#b08968')
           .lineWidth(1)
           .stroke();
           
        // Línea izquierda gruesa terracota
        doc.moveTo(40, currentY + 10)
           .lineTo(40, currentY + 60)
           .strokeColor('#b08968')
           .lineWidth(3)
           .stroke();

        doc.fillColor('#1c1a17')
           .fontSize(8)
           .font('Helvetica-Bold')
           .text('Mensaje de Inspiración o Notas del Cliente:', 50, currentY + 18);

        doc.fillColor('#6a645a')
           .font('Helvetica-Oblique')
           .text(`"${lead.message}"`, 50, currentY + 32, { width: 495 });
           
        currentY += 70;
      }

      // ── TÉRMINOS Y CONDICIONES (PIE DE PÁGINA) ──
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        
        doc.moveTo(40, 735)
           .lineTo(555, 735)
           .strokeColor('#e5dfd5')
           .lineWidth(1)
           .stroke();

        doc.fillColor('#8b8377')
           .fontSize(7)
           .font('Helvetica')
           .text('Notas Importantes:', 40, 742)
           .text('1. Esta es una estimación conceptual inicial basada en los datos proporcionados en el formulario web. No representa una cotización final ni un contrato.', 40, 750)
           .text('2. La disponibilidad de la fecha tentativa queda sujeta a confirmación al momento del contacto directo y anticipo correspondiente.', 40, 758)
           .text('3. Los costos reales de proveedores externos (venues, catering, etc.) se cotizarán de forma personalizada en la etapa de planeación.', 40, 766);

        doc.fillColor('#b08968')
           .fontSize(8.5)
           .font('Helvetica-Bold')
           .text('Andrea Delgado · Wedding & Event Planner', 40, 785, { align: 'center' });

        // Número de página
        doc.fillColor('#6a645a')
           .fontSize(7.5)
           .font('Helvetica')
           .text(`Página ${i + 1} de ${range.count}`, 40, 800, { align: 'right' });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export const generateQuotePdf = onCall({
  region: REGION,
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

  logger.info(`Iniciando generación de PDF (PDFKit) para el Lead: ${leadId}`);

  try {
    // 1. Obtener información del Lead desde Firestore
    const leadDoc = await db.collection(COLLECTIONS.LEADS).doc(leadId).get();
    if (!leadDoc.exists) {
      throw new HttpsError('not-found', 'El prospecto no existe en Firestore.');
    }

    const lead = { id: leadDoc.id, ...leadDoc.data() } as Lead;

    // 2. Generar el PDF usando PDFKit en memoria
    logger.info('Generando PDFKit buffer...');
    const pdfBuffer = await createPdfBuffer(lead);
    logger.info('PDFKit generado exitosamente.');

    // 3. Subir a Firebase Storage
    const bucket = storage.bucket();
    const filePath = `quotes/${leadId}_cotizacion.pdf`;
    const fileRef = bucket.file(filePath);

    logger.info(`Subiendo PDF a Firebase Storage: ${filePath}`);
    await fileRef.save(pdfBuffer, {
      contentType: 'application/pdf',
      metadata: {
        metadata: {
          leadId: leadId,
          generator: 'generateQuotePdf-pdfkit',
        }
      }
    });

    // 4. Obtener URL de descarga firmada (Signed URL) que expire en 7 días
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
