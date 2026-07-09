/**
 * Fuente de datos del portafolio.
 *
 * Lee `src/data/portfolio-urls.json`, que puede estar:
 *   • «seed»: las pocas imágenes reales auto-hospedadas en `public/portfolio/`
 *     (para que el sitio funcione siempre), o
 *   • generado por `scripts/upload-portfolio.mjs`: URLs públicas de Firebase
 *     Storage con las ~100 fotos optimizadas a WebP.
 *
 * El landing consume estas funciones; no le importa de dónde vienen las URLs.
 */
import portfolioData from '@/data/portfolio-urls.json';

export type PortfolioCategory = 'bodas' | 'sociales' | 'corporativos';

export interface PortfolioImage {
  src: string;
  category: PortfolioCategory;
  alt: string;
}

interface PortfolioData {
  hero: string;
  images: PortfolioImage[];
}

const data = portfolioData as unknown as PortfolioData;

/** Orden y etiquetas de las categorías tal como se muestran en el sitio. */
export const CATEGORY_META: { key: PortfolioCategory; label: string; blurb: string }[] = [
  {
    key: 'bodas',
    label: 'Bodas',
    blurb: 'Celebraciones a la medida, del compromiso al último brindis.',
  },
  {
    key: 'sociales',
    label: 'Eventos sociales',
    blurb: 'XV años, aniversarios y reuniones con sello propio.',
  },
  {
    key: 'corporativos',
    label: 'Eventos corporativos',
    blurb: 'Lanzamientos, cenas de gala y experiencias de marca.',
  },
];

/** Imagen destacada del hero (con respaldo a la primera del portafolio). */
export const HERO_IMAGE: string = data.hero || data.images[0]?.src || '/portfolio/hero-salon.jpg';

/** Todas las imágenes del portafolio. */
export const PORTFOLIO_IMAGES: PortfolioImage[] = data.images ?? [];

/** Imágenes de una categoría concreta. */
export function imagesByCategory(category: PortfolioCategory): PortfolioImage[] {
  return PORTFOLIO_IMAGES.filter((img) => img.category === category);
}

/** Categorías que realmente tienen fotos (para no renderizar secciones vacías). */
export function populatedCategories(): { key: PortfolioCategory; label: string; blurb: string; images: PortfolioImage[] }[] {
  return CATEGORY_META.map((c) => ({ ...c, images: imagesByCategory(c.key) })).filter(
    (c) => c.images.length > 0,
  );
}
