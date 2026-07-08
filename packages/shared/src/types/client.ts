import type { UserRole } from '../constants.js';
import type { AuditFields, ContactInfo } from './common.js';

/**
 * Perfil de usuario autenticado (colección `users`).
 * El rol efectivo vive en los custom claims; aquí solo se refleja para UI.
 */
export interface UserProfile extends AuditFields {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  /** Espejo del custom claim (solo lectura para el cliente). */
  role?: UserRole;
  phone?: string;
}

/**
 * Client — Expediente comercial del cliente (colección `clients`).
 * Un cliente puede tener múltiples eventos.
 */
export interface Client extends AuditFields {
  id: string;
  /** UID de Firebase Auth si ya tiene acceso al portal. */
  uid?: string;
  contact: ContactInfo;
  /** Segundo contacto (p. ej. el otro novio/a). */
  secondaryContact?: ContactInfo;
  /** Datos fiscales para CFDI 4.0. */
  taxProfile?: TaxProfile;
  eventIds: string[];
  notes?: string;
}

/** Datos fiscales del receptor para facturación CFDI 4.0. */
export interface TaxProfile {
  /** RFC del receptor. */
  rfc: string;
  /** Razón social EXACTA como aparece en la Constancia de Situación Fiscal. */
  legalName: string;
  /** Código postal del domicilio fiscal. */
  zipCode: string;
  /** Régimen fiscal (catálogo SAT c_RegimenFiscal, p. ej. '612'). */
  taxRegime: string;
  /** Uso de CFDI (catálogo SAT c_UsoCFDI, p. ej. 'G03'). */
  cfdiUse: string;
  email: string;
}
