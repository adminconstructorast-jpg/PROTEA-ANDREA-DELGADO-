import Link from 'next/link';
import { Logo } from './Logo';

export function SiteFooter() {
  return (
    <footer className="border-t border-sand bg-sand/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 md:grid-cols-4">
        <div>
          <Logo height={44} />
          <p className="mt-4 text-sm text-ink/70">
            Wedding &amp; Event Planning de alto perfil en México.
          </p>
        </div>
        <div>
          <p className="eyebrow mb-3">Explora</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/#servicios" className="hover:text-terracotta">Servicios</Link></li>
            <li><Link href="/#portafolio" className="hover:text-terracotta">Portafolio</Link></li>
            <li><Link href="/cotizar" className="hover:text-terracotta">Cotizador</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-3">Portales</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/portal" className="hover:text-terracotta">Portal de clientes</Link></li>
            <li><Link href="/admin" className="hover:text-terracotta">Portal de la planner</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-3">Contacto</p>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                href="https://www.instagram.com/andreadelgadoplanner/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-terracotta"
              >
                @andreadelgadoplanner
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-sand/70 py-5 text-center text-xs text-ink/50">
        © {new Date().getFullYear()} Andrea Delgado. Todos los derechos reservados.
      </div>
    </footer>
  );
}
