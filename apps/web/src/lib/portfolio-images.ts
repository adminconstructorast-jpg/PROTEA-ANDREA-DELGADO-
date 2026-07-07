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

export const PORTFOLIO_PHOTOS: PortfolioPhoto[] = [
  { id: 'boda-elegante', url: '/portfolio/boda-elegante.jpg', title: 'Boda Elegante', tag: 'Monterrey' },
  { id: 'identidad-boda', url: '/portfolio/identidad-boda.jpg', title: 'Identidad de Boda', tag: 'Monterrey' },
  { id: 'evento-social', url: '/portfolio/evento-social.jpg', title: 'Noche de Fiesta', tag: 'Monterrey' },
  { id: 'detalles-rojo', url: '/portfolio/detalles-rojo.jpg', title: 'Despedida de Soltera', tag: 'Monterrey' },
];

export const HERO_IMAGE = '/portfolio/hero-salon.jpg';
export const ABOUT_IMAGE = '/portfolio/nosotros.jpg';
export const DETAIL_IMAGE_1 = '/portfolio/detalle-preparativos.jpg';
