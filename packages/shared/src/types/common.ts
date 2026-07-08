/**
 * Tipos base compartidos.
 *
 * `DocTimestamp` es estructuralmente compatible con `Timestamp` tanto del
 * SDK cliente (`firebase/firestore`) como del Admin SDK, de modo que las
 * mismas interfaces sirven en `apps/web` y en `functions` sin castings.
 */
export interface DocTimestamp {
  toDate(): Date;
  toMillis(): number;
}

/** Campos de auditoría presentes en todos los documentos. */
export interface AuditFields {
  createdAt: DocTimestamp;
  updatedAt?: DocTimestamp;
}

/** Dinero en centavos para evitar errores de punto flotante. */
export interface Money {
  /** Monto en centavos (p. ej. $1,500.00 MXN → 150000). */
  amountCents: number;
  currency: 'MXN' | 'USD';
}

export interface ContactInfo {
  fullName: string;
  email: string;
  /** Teléfono en formato E.164 (p. ej. +5215512345678). */
  phone: string;
}
