/**
 * Identidad de marca de PROTEA: monograma (flor protea estilizada) + wordmark.
 * Placeholder tipográfico hasta que se integre el logo oficial en archivo.
 */
export function LogoMark({ className = 'h-8 w-8', color = '#b5674a' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      {/* Pétalos exteriores */}
      <path
        d="M24 4C24 4 30 10 30 17C30 21 27 24 24 24C21 24 18 21 18 17C18 10 24 4 24 4Z"
        stroke={color}
        strokeWidth="1.4"
        fill={`${color}1a`}
      />
      <path
        d="M8 15C8 15 16 16 20 22C22 25 21 29 18 30C15 31 11 29 9 25C6 20 8 15 8 15Z"
        stroke={color}
        strokeWidth="1.4"
        fill={`${color}1a`}
      />
      <path
        d="M40 15C40 15 32 16 28 22C26 25 27 29 30 30C33 31 37 29 39 25C42 20 40 15 40 15Z"
        stroke={color}
        strokeWidth="1.4"
        fill={`${color}1a`}
      />
      <path
        d="M12 34C12 34 18 30 24 30C28 30 31 33 30 36C29 39 24 41 20 40C15 39 12 34 12 34Z"
        stroke={color}
        strokeWidth="1.4"
        fill={`${color}1a`}
      />
      <path
        d="M36 34C36 34 30 30 24 30C20 30 17 33 18 36C19 39 24 41 28 40C33 39 36 34 36 34Z"
        stroke={color}
        strokeWidth="1.4"
        fill={`${color}1a`}
      />
      {/* Centro */}
      <circle cx="24" cy="24" r="4" fill={color} />
    </svg>
  );
}

export function Logo({
  className = '',
  markClassName = 'h-9 w-9',
  variant = 'dark',
}: {
  className?: string;
  markClassName?: string;
  variant?: 'dark' | 'light';
}) {
  const textColor = variant === 'dark' ? 'text-ink' : 'text-cream';
  const subColor = variant === 'dark' ? 'text-gold' : 'text-cream/70';
  const markColor = variant === 'dark' ? '#b5674a' : '#faf7f2';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark className={markClassName} color={markColor} />
      <div className="flex flex-col leading-none">
        <span className={`font-serif text-xl tracking-wide ${textColor}`}>PROTEA</span>
        <span className={`text-[10px] uppercase tracking-luxe ${subColor}`}>Andrea Delgado</span>
      </div>
    </div>
  );
}
