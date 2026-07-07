import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';
import { REGION } from '../config.js';
import { db, FieldValue } from '../lib/admin.js';
import { COLLECTIONS, type Guest, type RSVPStatus } from '../shared.js';

/**
 * Mantiene un documento agregado de estadísticas de RSVP por evento para el
 * dashboard en tiempo real (novios y planner), evitando leer toda la
 * subcolección de invitados en el cliente.
 *
 * Se recalcula al escribir cualquier invitado. Para eventos con miles de
 * invitados conviene migrar a incrementos por diff, pero el recálculo total
 * es simple y correcto para el volumen típico.
 */
export const onGuestWritten = onDocumentWritten(
  { region: REGION, document: `${COLLECTIONS.EVENTS}/{eventId}/${COLLECTIONS.GUESTS}/{guestId}` },
  async (event) => {
    const eventId = event.params.eventId;
    const guestsCol = db
      .collection(COLLECTIONS.EVENTS)
      .doc(eventId)
      .collection(COLLECTIONS.GUESTS);

    const snap = await guestsCol.get();

    const counts: Record<RSVPStatus, number> = {
      pending: 0,
      invited: 0,
      confirmed: 0,
      declined: 0,
      no_response: 0,
    };
    let totalGuests = 0;
    let confirmedSeats = 0;

    for (const doc of snap.docs) {
      const g = doc.data() as Guest;
      counts[g.rsvpStatus] = (counts[g.rsvpStatus] ?? 0) + 1;
      totalGuests += 1;
      if (g.rsvpStatus === 'confirmed') {
        confirmedSeats += 1 + (g.companionsConfirmed ?? 0);
      }
    }

    await db
      .collection(COLLECTIONS.EVENTS)
      .doc(eventId)
      .set(
        {
          rsvpStats: {
            ...counts,
            totalGuests,
            confirmedSeats,
            respondedPercent:
              totalGuests > 0
                ? Math.round(((counts.confirmed + counts.declined) / totalGuests) * 100)
                : 0,
            updatedAt: FieldValue.serverTimestamp(),
          },
        },
        { merge: true },
      );

    logger.debug(`Stats RSVP recalculadas para evento ${eventId}`, counts);
  },
);
