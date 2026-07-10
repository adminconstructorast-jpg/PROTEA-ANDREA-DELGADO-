import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getFunctions, type Functions } from 'firebase/functions';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { isSupported, getAnalytics, type Analytics } from 'firebase/analytics';

/**
 * Inicialización del SDK cliente de Firebase.
 *
 * La configuración pública se toma de variables NEXT_PUBLIC_* (no son secretas;
 * la seguridad la aplican las reglas de Firestore y Auth). Estas variables se
 * "inlinean" en tiempo de build. Para que el build de CI y el prerender no
 * fallen cuando no hay credenciales presentes, se usa un placeholder no vacío
 * que permite cargar el módulo sin lanzar `auth/invalid-api-key`; en runtime
 * (con las variables reales) la configuración correcta prevalece.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'missing-api-key',
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'protea-andrea-delgado.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'protea-andrea-delgado',
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'protea-andrea-delgado.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
export const functions: Functions = getFunctions(app, 'us-central1');

/**
 * App Check (reCAPTCHA v3) — protege los callables públicos (cotizador, chatbot)
 * contra abuso. Solo se inicializa en el navegador y cuando existe la clave del
 * sitio (`NEXT_PUBLIC_FIREBASE_APPCHECK_KEY`); si no está configurada, se omite
 * para no afectar el sitio en producción. El refuerzo en el backend se activa
 * aparte con el parámetro `APP_CHECK_ENFORCE`, permitiendo un despliegue
 * escalonado (primero el cliente emite tokens, luego el backend los exige).
 */
if (typeof window !== 'undefined') {
  const appCheckKey = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_KEY;
  if (appCheckKey) {
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(appCheckKey),
        isTokenAutoRefreshEnabled: true,
      });
    } catch {
      // initializeAppCheck lanza si se invoca dos veces (p. ej. Fast Refresh);
      // es seguro ignorarlo porque la instancia previa sigue vigente.
    }
  }
}

/** Analytics solo funciona en el navegador y en contextos soportados. */
export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === 'undefined') return null;
  if (!(await isSupported())) return null;
  return getAnalytics(app);
}
