/**
 * Asigna el rol de plataforma (custom claim + espejo en Firestore) a un
 * usuario de Firebase Auth identificado por su correo.
 *
 * Pensado para correr en CI (workflow "Rol · Asignar acceso") con las
 * credenciales de la cuenta de servicio (`GOOGLE_APPLICATION_CREDENTIALS`),
 * aunque también funciona localmente con una clave de servicio.
 *
 * Uso: node scripts/set-role.mjs --email correo@dominio.com --role planner
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// firebase-admin ya es dependencia del workspace `functions` (hoisted por npm).
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(repoRoot, 'functions', 'package.json'));
const admin = require('firebase-admin');

const VALID_ROLES = ['planner', 'staff', 'client'];

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const email = arg('email');
const role = arg('role');

if (!email || !email.includes('@')) {
  console.error('✗ Falta --email válido');
  process.exit(1);
}
if (!VALID_ROLES.includes(role)) {
  console.error(`✗ --role debe ser uno de: ${VALID_ROLES.join(', ')}`);
  process.exit(1);
}

admin.initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID || 'protea-andrea-delgado',
});

const auth = admin.auth();
const db = admin.firestore();

let user;
try {
  user = await auth.getUserByEmail(email);
} catch {
  console.error(`✗ No existe un usuario de Firebase Auth con el correo ${email}.`);
  console.error('  El usuario debe iniciar sesión en el sitio al menos una vez antes.');
  process.exit(1);
}

// 1) Custom claim: es lo que leen AuthGate y las reglas de Firestore.
await auth.setCustomUserClaims(user.uid, { role });

// 2) Espejo en /users/{uid} (solo informativo para la UI).
await db.collection('users').doc(user.uid).set(
  {
    uid: user.uid,
    email: user.email ?? email,
    displayName: user.displayName ?? null,
    role,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  { merge: true },
);

// 3) Invalidar los refresh tokens: la sesión abierta pedirá re-autenticarse
//    y el nuevo token ya traerá el claim (sin esperar la expiración de 1h).
await auth.revokeRefreshTokens(user.uid);

console.log(`✓ ${email} (uid ${user.uid}) ahora tiene rol "${role}".`);
console.log('  El usuario debe cerrar sesión y volver a entrar para ver el cambio.');
