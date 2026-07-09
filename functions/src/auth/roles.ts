import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { REGION, PLANNER_ADMIN_EMAILS } from '../config.js';
import { auth, db } from '../lib/admin.js';
import { COLLECTIONS, USER_ROLES, type UserRole } from '../shared.js';

/**
 * Asignación de rol al registrarse.
 *
 * El cliente crea su documento de perfil en `/users/{uid}` justo tras
 * autenticarse (las reglas lo permiten para el propio uid, sin incluir `role`).
 * Este trigger de Firestore (2ª gen) detecta ese alta y asigna el rol
 * correspondiente como custom claim de Auth + lo refleja en el documento.
 *
 * Se usa un trigger de Firestore en lugar de una blocking function de Auth
 * (`beforeUserCreated`), porque las blocking functions requieren Identity
 * Platform (GCIP). El custom claim se refleja en el token del usuario tras el
 * siguiente refresh (`getIdToken(true)`), que el cliente fuerza al registrarse.
 *
 * Los correos en PLANNER_ADMIN_EMAILS obtienen rol `planner`; el resto `client`.
 */
export const onUserProfileCreated = onDocumentCreated(
  { document: 'users/{uid}', region: REGION },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const uid = event.params.uid;
    const data = snap.data() as { email?: string; role?: UserRole };

    // Si ya tiene rol (p. ej. lo creó la planner manualmente), no reprocesar.
    if (data.role && USER_ROLES.includes(data.role)) return;

    const adminEmails = PLANNER_ADMIN_EMAILS.value()
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const email = String(data.email ?? '').toLowerCase();
    const role: UserRole = adminEmails.includes(email) ? 'planner' : 'client';

    // El rol vive en el custom claim del token de Auth.
    try {
      await auth.setCustomUserClaims(uid, { role });
    } catch (err) {
      logger.error('No se pudo asignar el custom claim de rol', err);
    }

    // Reflejar el rol en el perfil.
    try {
      await snap.ref.set({ role }, { merge: true });
    } catch (err) {
      logger.error('No se pudo escribir el rol en el perfil', err);
    }
  },
);

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
