import type { SocialId } from '@/lib/social';

/**
 * Íconos de redes sociales en SVG inline (trazos minimalistas, 24×24).
 * Server-safe: sin estado ni eventos, usable desde el footer (RSC).
 * Heredan el color vía `currentColor`.
 */
export function SocialIcon({ id, className }: { id: SocialId; className?: string }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true,
  };

  switch (id) {
    case 'instagram':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg {...common}>
          {/* Nota musical estilizada (logo simplificado). */}
          <path d="M14 4v9.5a3.75 3.75 0 1 1-3.75-3.75" />
          <path d="M14 4c.4 2.6 2.2 4.4 5 4.7" />
        </svg>
      );
    case 'whatsapp':
      return (
        <svg {...common}>
          {/* Globo de chat con cola (logo simplificado). */}
          <path d="M12 3.5a8.5 8.5 0 0 0-7.3 12.9L3.5 20.5l4.2-1.1A8.5 8.5 0 1 0 12 3.5Z" />
          <path d="M9 8.8c-.3 2.4 3.2 6 5.9 6.2.8 0 1.6-.4 1.6-1l-.4-1.2-1.7-.5-.9.7c-1-.4-2.2-1.6-2.6-2.6l.7-.9-.5-1.7-1.2-.4c-.5 0-.9.8-.9 1.4Z" />
        </svg>
      );
    case 'facebook':
      return (
        <svg {...common}>
          <path d="M14.5 8.5V7a1.5 1.5 0 0 1 1.5-1.5h1.5V2.8h-2.3A3.7 3.7 0 0 0 11.5 6.5v2h-2.3v2.9h2.3v9.8h3v-9.8h2.4l.5-2.9h-2.9Z" />
        </svg>
      );
  }
}
