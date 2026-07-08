/**
 * Normalización de teléfonos a E.164, con heurística para México.
 * WhatsApp Business API exige E.164 sin espacios ni símbolos (salvo '+').
 */

const DEFAULT_COUNTRY_CODE = '52'; // México

/**
 * Normaliza un teléfono capturado por humanos a E.164.
 * Ejemplos:
 *   '55 1234 5678'        → '+525512345678'
 *   '(55) 1234-5678'      → '+525512345678'
 *   '+52 1 55 1234 5678'  → '+5215512345678'
 *   '5512345678'          → '+525512345678'
 * Devuelve null si no puede producir un número plausible.
 */
export function normalizePhone(
  raw: string,
  defaultCountryCode: string = DEFAULT_COUNTRY_CODE,
): string | null {
  const digits = raw.replace(/[^\d+]/g, '');
  if (!digits) return null;

  let e164: string;
  if (digits.startsWith('+')) {
    e164 = `+${digits.slice(1).replace(/\D/g, '')}`;
  } else if (digits.startsWith('00')) {
    e164 = `+${digits.slice(2)}`;
  } else if (digits.length === 10) {
    // Número nacional mexicano de 10 dígitos.
    e164 = `+${defaultCountryCode}${digits}`;
  } else if (digits.length === 12 && digits.startsWith(defaultCountryCode)) {
    e164 = `+${digits}`;
  } else if (digits.length === 13 && digits.startsWith(`${defaultCountryCode}1`)) {
    // Formato legado +52 1 para móviles.
    e164 = `+${digits}`;
  } else {
    return null;
  }

  const numeric = e164.slice(1);
  if (numeric.length < 10 || numeric.length > 15) return null;
  return e164;
}

/** Convierte E.164 al formato wa_id de Meta (sin '+'). */
export function phoneToWaId(e164: string): string {
  return e164.replace(/^\+/, '');
}

/** Convierte un wa_id de Meta a E.164. */
export function waIdToPhone(waId: string): string {
  return waId.startsWith('+') ? waId : `+${waId}`;
}
