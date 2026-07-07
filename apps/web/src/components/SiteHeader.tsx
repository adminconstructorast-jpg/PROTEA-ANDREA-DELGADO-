'use client';

import Link from 'next/link';

/** Encabezado del sitio público con navegación premium. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-sand/60 bg-cream/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex flex-col leading-none">
          <span className="font-serif text-xl tracking-wide">PROTEA</span>
          <span className="text-[10px] uppercase tracking-luxe text-gold">Andrea Delgado</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm md:flex">
          <Link href="/#servicios" className="transition hover:text-terracotta">
            Servicios
          </Link>
          <Link href="/#portafolio" className="transition hover:text-terracotta">
            Portafolio
          </Link>
          <Link href="/#nosotros" className="transition hover:text-terracotta">
            Nosotros
          </Link>
          <Link href="/portal" className="transition hover:text-terracotta">
            Portal
          </Link>
        </nav>

        <Link href="/cotizar" className="btn-primary hidden md:inline-flex">
          Cotizar mi evento
        </Link>
      </div>
    </header>
  );
}
