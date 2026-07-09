import * as functionsV1 from 'firebase-functions/v1';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { REGION, PLANNER_ADMIN_EMAILS } from '../config.js';
import { auth, db, FieldValue } from '../lib/admin.js';
import { COLLECTIONS, USER_ROLES, type UserRole } from '../shared.js';

/**
 * Al crear un usuario: asigna rol por defecto (custom claim) y espeja el perfil.
 * Los correos en PLANNER_ADMIN_EMAILS obtienen rol `planner` automáticamente;
 * el resto entra como `client`.
 *
 * Se usa un trigger de Auth de 1ª gen (`auth.user().onCreate`) en vez de una
 * blocking function (`beforeUserCreated`), porque las blocking functions solo
 * están disponibles en proyectos con Identity Platform (GCIP) habilitado. El
 * trigger 1st gen funciona con Firebase Auth estándar sin costo adicional; el
 * custom claim se refleja en el token del usuario tras el siguiente refresh
 * (`getIdToken(true)`), que el cliente hace de forma natural en el próximo login.
 */
export const onUserCreate = functionsV1
  .region(REGION)
  .auth.user()
  .onCreate(async (user) => {
    const adminEmails = PLANNER_ADMIN_EMAILS.value()
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const email = (user.email ?? '').toLowerCase();
    const role: UserRole = adminEmails.includes(email) ? 'planner' : 'client';

    // El rol vive en el custom claim del token de Auth.
    try {
      await auth.setCustomUserClaims(user.uid, { role });
    } catch (err) {
      logger.error('No se pudo asignar el custom claim de rol', err);
    }

    // Espejo del perfil en Firestore.
    try {
      await db
        .collection(COLLECTIONS.USERS)
        .doc(user.uid)
        .set(
          {
            uid: user.uid,
            displayName: user.displayName ?? email.split('@')[0] ?? 'Usuario',
            email: user.email ?? '',
            photoURL: user.photoURL ?? null,
            role,
            createdAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
    } catch (err) {
      logger.error('No se pudo crear el perfil de usuario', err);
    }
  });

/**
 * Callable (solo planner): cambia el rol de un usuario y sincroniza el claim.
 */
export const setUserRole = onCall({ region: REGION }, async (request) => {
  const callerRole = (request.auth?.token as Record<string, unknown> | undefined)?.role;
  if (callerRole !== 'planner') {
    throw new HttpsError('permission-denied', 'Solo la planner puede cambiar roles.');
  }

  const { uid, role } = request.data as { uid: string; role: UserRole };
  if (!uid || !USER_ROLES.includes(role)) {
    throw new HttpsError('invalid-argument', 'uid y role válidos son obligatorios.');
  }

  await auth.setCustomUserClaims(uid, { role });
  await db.collection(COLLECTIONS.USERS).doc(uid).set({ role }, { merge: true });

  logger.info(`Rol de ${uid} actualizado a ${role}`);
  return { ok: true };
});
