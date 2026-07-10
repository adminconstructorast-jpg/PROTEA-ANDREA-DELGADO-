/**
 * Redes sociales oficiales de Andrea Delgado.
 * Única fuente de verdad para el footer, el sitio y (a futuro) códigos QR.
 */
export type SocialId = 'instagram' | 'tiktok' | 'whatsapp' | 'facebook';

export interface SocialLink {
  id: SocialId;
  label: string;
  /** Texto visible junto al ícono (handle o número). */
  handle: string;
  href: string;
  /** Permite dejar una red preparada pero oculta hasta tener su URL oficial. */
  enabled: boolean;
  /** Ruta (en /public) del código QR de esta red; se inyectará más adelante. */
  qrSrc?: string;
}

export const SOCIAL_LINKS: SocialLink[] = [
  {
    id: 'instagram',
    label: 'Instagram',
    handle: '@andreadelgadoplanner',
    href: 'https://www.instagram.com/andreadelgadoplanner/',
    enabled: true,
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    handle: '@andreadelgadoplanner',
    href: 'https://www.tiktok.com/@andreadelgadoplanner',
    enabled: true,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    handle: '+52 81 8201 7654',
    href: 'https://wa.me/528182017654',
    enabled: true,
  },
  // Pendiente la URL oficial de Facebook: al tenerla, llenar href y enabled: true.
  {
    id: 'facebook',
    label: 'Facebook',
    handle: 'Andrea Delgado Planner',
    href: '',
    enabled: false,
  },
];

/** Redes que se muestran en el sitio (las que ya tienen URL oficial). */
export const VISIBLE_SOCIAL_LINKS = SOCIAL_LINKS.filter((s) => s.enabled);
