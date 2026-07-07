import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { REGION } from '../config.js';
import { db, FieldValue } from '../lib/admin.js';
import { COLLECTIONS, normalizePhone, type Guest } from '../shared.js';

interface RawGuestRow {
  fullName?: string;
  name?: string;
  nombre?: string;
  phone?: string;
  telefono?: string;
  celular?: string;
  email?: string;
  correo?: string;
  groupName?: string;
  grupo?: string;
  familia?: string;
  side?: string;
  lado?: string;
  seats?: number | string;
  lugares?: number | string;
  tags?: string;
}

function pick(row: RawGuestRow, keys: (keyof RawGuestRow)[]): string | undefined {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
  }
  return undefined;
}

function assertStaff(auth: { token?: Record<string, unknown> } | undefined): void {
  const role = auth?.token?.role;
  if (role !== 'planner' && role !== 'staff') {
    throw new HttpsError('permission-denied', 'Requiere rol planner o staff.');
  }
}

/**
 * Callable: importación masiva de invitados a un evento.
 * El cliente parsea el Excel/CSV (SheetJS) y envía filas normalizadas.
 * Aquí se validan, se normalizan teléfonos y se escriben en lote.
 *
 * Devuelve un resumen con conteos y filas rechazadas para feedback en UI.
 */
export const importGuests = onCall({ region: REGION }, async (request) => {
  assertStaff(request.auth as never);

  const { eventId, rows } = request.data as { eventId: string; rows: RawGuestRow[] };
  if (!eventId || !Array.isArray(rows)) {
    throw new HttpsError('invalid-argument', 'eventId y rows son obligatorios.');
  }
  if (rows.length > 5000) {
    throw new HttpsError('invalid-argument', 'Máximo 5000 invitados por importación.');
  }

  const eventRef = db.collection(COLLECTIONS.EVENTS).doc(eventId);
  const eventSnap = await eventRef.get();
  if (!eventSnap.exists) {
    throw new HttpsError('not-found', 'Evento no encontrado.');
  }

  const guestsCol = eventRef.collection(COLLECTIONS.GUESTS);
  const rejected: Array<{ row: number; reason: string }> = [];
  const seenPhones = new Set<string>();

  // Firestore permite máx 500 operaciones por batch.
  let batch = db.batch();
  let opsInBatch = 0;
  let imported = 0;

  const commitBatch = async () => {
    if (opsInBatch > 0) {
      await batch.commit();
      batch = db.batch();
      opsInBatch = 0;
    }
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const fullName = pick(row, ['fullName', 'name', 'nombre']);
    const rawPhone = pick(row, ['phone', 'telefono', 'celular']);

    if (!fullName) {
      rejected.push({ row: i + 1, reason: 'Falta nombre' });
      continue;
    }
    if (!rawPhone) {
      rejected.push({ row: i + 1, reason: 'Falta teléfono' });
      continue;
    }
    const phone = normalizePhone(rawPhone);
    if (!phone) {
      rejected.push({ row: i + 1, reason: `Teléfono inválido: ${rawPhone}` });
      continue;
    }
    if (seenPhones.has(phone)) {
      rejected.push({ row: i + 1, reason: `Teléfono duplicado en el archivo: ${phone}` });
      continue;
    }
    seenPhones.add(phone);

    const seatsRaw = pick(row, ['seats', 'lugares']);
    const seats = seatsRaw ? Math.max(1, Number.parseInt(seatsRaw, 10) || 1) : 1;
    const tagsRaw = pick(row, ['tags']);

    const guestDoc: Omit<Guest, 'id' | 'createdAt'> & { createdAt: FieldValue } = {
      fullName,
      phone,
      email: pick(row, ['email', 'correo']),
      groupName: pick(row, ['groupName', 'grupo', 'familia']),
      side: pick(row, ['side', 'lado']),
      tags: tagsRaw ? tagsRaw.split(/[,;]/).map((t) => t.trim()).filter(Boolean) : [],
      rsvpStatus: 'pending',
      seatsAllocated: seats,
      whatsapp: { remindersSent: 0 },
      tableId: null,
      seatNumber: null,
      eventId,
      source: 'import_xlsx',
      createdAt: FieldValue.serverTimestamp(),
    };

    const ref = guestsCol.doc();
    batch.set(ref, guestDoc);
    opsInBatch += 1;
    imported += 1;

    if (opsInBatch >= 450) await commitBatch();
  }

  await commitBatch();

  // Actualizar contador esperado en el evento.
  await eventRef.set(
    { expectedGuests: FieldValue.increment(imported), updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );

  logger.info(`Importados ${imported} invitados a evento ${eventId} (${rejected.length} rechazados)`);
  return { imported, rejected, total: rows.length };
});
