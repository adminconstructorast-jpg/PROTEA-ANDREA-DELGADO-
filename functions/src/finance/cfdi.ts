import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import {
  REGION,
  PAC_API_KEY,
  PAC_BASE_URL,
  CFDI_ISSUER_RFC,
  CFDI_ISSUER_NAME,
  CFDI_ISSUER_TAX_REGIME,
  CFDI_EXPEDITION_ZIP,
} from '../config.js';
import { db, FieldValue } from '../lib/admin.js';
import { COLLECTIONS, type Invoice } from '../shared.js';

/**
 * Puente de integración para Timbrado SAT CFDI 4.0.
 *
 * Diseñado como adaptador sobre un PAC (Proveedor Autorizado de Certificación).
 * El ejemplo usa el formato tipo Facturama, pero la interfaz `PacAdapter`
 * permite intercambiar de PAC (Finkok, SW sapien, etc.) sin tocar el resto.
 *
 * IMPORTANTE: el timbrado es exclusivo del backend. Las reglas de Firestore
 * impiden escribir `invoices` desde el cliente.
 */

interface StampResult {
  ok: boolean;
  uuid?: string;
  series?: string;
  folio?: string;
  xmlBase64?: string;
  pdfBase64?: string;
  pacRef?: string;
  error?: { code: string; message: string };
}

/** Construye el payload CFDI 4.0 y lo envía al PAC para timbrar. */
async function stampWithPac(invoice: Invoice): Promise<StampResult> {
  const baseUrl = PAC_BASE_URL.value().replace(/\/$/, '');
  const apiKey = PAC_API_KEY.value();

  // Payload representativo estilo Facturama (CFDI 4.0).
  const body = {
    Serie: invoice.series ?? 'PROTEA',
    Currency: invoice.currency,
    ExpeditionPlace: CFDI_EXPEDITION_ZIP.value(),
    PaymentConditions: '',
    CfdiType: 'I', // Ingreso
    PaymentForm: invoice.paymentForm, // c_FormaPago
    PaymentMethod: invoice.paymentMethod, // PUE / PPD
    Issuer: {
      Rfc: CFDI_ISSUER_RFC.value(),
      Name: CFDI_ISSUER_NAME.value(),
      FiscalRegime: CFDI_ISSUER_TAX_REGIME.value(),
    },
    Receiver: {
      Rfc: invoice.receiver.rfc,
      Name: invoice.receiver.legalName,
      CfdiUse: invoice.receiver.cfdiUse,
      FiscalRegime: invoice.receiver.taxRegime,
      TaxZipCode: invoice.receiver.zipCode,
    },
    Items: invoice.concepts.map((c) => {
      const unitPrice = c.unitPriceCents / 100;
      const subtotal = (c.unitPriceCents * c.quantity) / 100;
      const tax = subtotal * 0.16;
      return {
        ProductCode: c.satProductCode,
        UnitCode: c.unitCode,
        Description: c.description,
        Quantity: c.quantity,
        UnitPrice: unitPrice,
        Subtotal: subtotal,
        TaxObject: '02', // objeto de impuesto
        Taxes: [
          {
            Total: tax,
            Name: 'IVA',
            Base: subtotal,
            Rate: 0.16,
            IsRetention: false,
          },
        ],
        Total: subtotal + tax,
      };
    }),
  };

  try {
    const res = await fetch(`${baseUrl}/3/cfdis`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const json = (await res.json()) as Record<string, any>;
    if (!res.ok) {
      return {
        ok: false,
        error: { code: String(res.status), message: json?.Message ?? 'Error del PAC' },
      };
    }

    return {
      ok: true,
      uuid: json.Complement?.TaxStamp?.Uuid ?? json.Uuid,
      series: json.Serie,
      folio: json.Folio ? String(json.Folio) : undefined,
      pacRef: json.Id,
    };
  } catch (err) {
    return {
      ok: false,
      error: { code: 'network', message: err instanceof Error ? err.message : 'error de red' },
    };
  }
}

/**
 * Callable (solo planner): timbra una factura CFDI 4.0 a partir de un
 * documento `invoices` en estado `draft`.
 */
export const stampInvoice = onCall(
  { region: REGION, secrets: [PAC_API_KEY] },
  async (request) => {
    const role = (request.auth?.token as Record<string, unknown> | undefined)?.role;
    if (role !== 'planner') {
      throw new HttpsError('permission-denied', 'Solo la planner puede timbrar.');
    }

    const { invoiceId } = request.data as { invoiceId: string };
    if (!invoiceId) {
      throw new HttpsError('invalid-argument', 'invoiceId es obligatorio.');
    }

    const ref = db.collection(COLLECTIONS.INVOICES).doc(invoiceId);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new HttpsError('not-found', 'Factura no encontrada.');
    }
    const invoice = { id: snap.id, ...snap.data() } as Invoice;

    if (invoice.status === 'stamped') {
      return { ok: true, uuid: invoice.uuid, alreadyStamped: true };
    }

    await ref.set({ status: 'stamping', updatedAt: FieldValue.serverTimestamp() }, { merge: true });

    const result = await stampWithPac(invoice);

    if (!result.ok) {
      await ref.set(
        {
          status: 'error',
          error: {
            code: result.error?.code ?? 'unknown',
            message: result.error?.message ?? 'Error desconocido',
            at: FieldValue.serverTimestamp(),
          },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      logger.error(`Timbrado fallido para ${invoiceId}`, result.error);
      throw new HttpsError('internal', result.error?.message ?? 'Error al timbrar.');
    }

    await ref.set(
      {
        status: 'stamped',
        uuid: result.uuid,
        series: result.series ?? invoice.series,
        folio: result.folio ?? invoice.folio,
        pacRef: result.pacRef,
        issuedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    logger.info(`Factura ${invoiceId} timbrada. UUID: ${result.uuid}`);
    return { ok: true, uuid: result.uuid };
  },
);
