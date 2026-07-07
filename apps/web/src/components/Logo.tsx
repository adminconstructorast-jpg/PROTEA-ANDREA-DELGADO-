import Image from 'next/image';

/**
 * Logotipo oficial de Andrea Delgado (Event & Wedding Planner), extraído de
 * los archivos de marca provistos y recoloreado según el fondo donde se use.
 * `variant="dark"` = trazo oscuro para fondos claros; `variant="light"` =
 * trazo claro para fondos oscuros.
 */
export function Logo({
  className = '',
  variant = 'dark',
  height = 40,
}: {
  className?: string;
  variant?: 'dark' | 'light';
  height?: number;
}) {
  const src = variant === 'dark' ? '/brand/logo-dark.png' : '/brand/logo-light.png';
  // Relación de aspecto real del logotipo extraído (595 x 372 tras recorte).
  const width = Math.round(height * (595 / 372));

  return (
    <Image
      src={src}
      alt="Andrea Delgado — Event & Wedding Planner"
      width={width}
      height={height}
      priority
      className={className}
      style={{ height, width: 'auto' }}
    />
  );
}
