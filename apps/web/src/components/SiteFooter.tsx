import Link from 'next/link';
import Image from 'next/image';
import { Logo } from './Logo';
import { SocialIcon } from './icons/SocialIcon';
import { VISIBLE_SOCIAL_LINKS } from '@/lib/social';

export function SiteFooter() {
  return (
    <footer className="border-t border-sand bg-sand/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 md:grid-cols-4">
        <div>
          <Logo height={44} />
          <p className="mt-4 text-sm text-ink/70">
            Wedding &amp; Event Planning de alto perfil en México.
          </p>
          {/* Fila de íconos rápidos (las mismas redes de la columna Síguenos). */}
          <div className="mt-5 flex items-center gap-4">
            {VISIBLE_SOCIAL_LINKS.map((s) => (
              <a
                key={s.id}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="text-ink/60 transition hover:text-terracotta"
              >
                <SocialIcon id={s.id} className="h-5 w-5" />
              </a>
            ))}
          </div>
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
          <p className="eyebrow mb-3">Síguenos</p>
          <ul className="space-y-3 text-sm">
            {VISIBLE_SOCIAL_LINKS.map((s) => (
              <li key={s.id}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 hover:text-terracotta"
                >
                  <SocialIcon id={s.id} className="h-4 w-4 shrink-0" />
                  <span>{s.handle}</span>
                </a>
                {/* Espacio preparado: al asignar `qrSrc` en lib/social.ts, el QR aparece aquí. */}
                {s.qrSrc && (
                  <Image
                    src={s.qrSrc}
                    alt={`Código QR de ${s.label}`}
                    width={96}
                    height={96}
                    className="mt-2 rounded-lg border border-sand bg-white p-1"
                  />
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-sand/70 py-5 text-center text-xs text-ink/50">
        © {new Date().getFullYear()} Andrea Delgado. Todos los derechos reservados.
      </div>
    </footer>
  );
}
