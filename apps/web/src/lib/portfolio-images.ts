/**
 * Fotografía real de eventos de PROTEA · Andrea Delgado, obtenida de
 * @andreadelgadoplanner y auto-hospedada en `apps/web/public/portfolio/`.
 */
export interface PortfolioPhoto {
  id: string;
  url: string;
  title: string;
  tag: string;
}

// 'evento-social.jpg' (Noche de Fiesta) se retiró del portafolio por baja
// calidad/resolución (miniatura de reel, borrosa). Sustituir cuando Andrea
// comparta una foto de evento social en mejor resolución.
export const PORTFOLIO_PHOTOS: PortfolioPhoto[] = [
  { id: 'boda-elegante', url: '/portfolio/boda-elegante.jpg', title: 'Boda Elegante', tag: 'Monterrey' },
  { id: 'identidad-boda', url: '/portfolio/identidad-boda.jpg', title: 'Identidad de Boda', tag: 'Monterrey' },
  { id: 'detalles-rojo', url: '/portfolio/detalles-rojo.jpg', title: 'Despedida de Soltera', tag: 'Monterrey' },
];

export const HERO_IMAGE = '/portfolio/hero-salon.jpg';
export const DETAIL_IMAGE_1 = '/portfolio/detalle-preparativos.jpg';
