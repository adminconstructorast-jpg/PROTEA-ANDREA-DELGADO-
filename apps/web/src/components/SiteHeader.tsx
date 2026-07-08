'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Logo } from './Logo';

const NAV_LINKS = [
  { href: '/#servicios', label: 'Servicios' },
  { href: '/#portafolio', label: 'Portafolio' },
  { href: '/#nosotros', label: 'Nosotros' },
  { href: '/portal', label: 'Portal' },
];

/** Encabezado del sitio público con navegación premium y menú móvil. */
export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-sand/60 bg-cream/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" onClick={() => setOpen(false)}>
          <Logo height={36} />
        </Link>

        <nav className="hidden items-center gap-8 text-sm md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-terracotta">
              {link.label}
            </Link>
          ))}
        </nav>

        <Link href="/cotizar" className="btn-primary hidden md:inline-flex">
          Cotizar mi evento
        </Link>

        {/* Botón de menú móvil */}
        <button
          type="button"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-sand md:hidden"
        >
          <span className="relative block h-3.5 w-4">
            <span
              className={`absolute left-0 top-0 block h-[1.5px] w-4 bg-ink transition-transform ${open ? 'translate-y-[6px] rotate-45' : ''}`}
            />
            <span
              className={`absolute left-0 top-[6px] block h-[1.5px] w-4 bg-ink transition-opacity ${open ? 'opacity-0' : 'opacity-100'}`}
            />
            <span
              className={`absolute left-0 top-[12px] block h-[1.5px] w-4 bg-ink transition-transform ${open ? '-translate-y-[6px] -rotate-45' : ''}`}
            />
          </span>
        </button>
      </div>

      {/* Panel de navegación móvil */}
      {open && (
        <nav className="border-t border-sand/60 bg-cream px-6 py-5 md:hidden">
          <ul className="space-y-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm transition hover:bg-sand"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/cotizar"
            onClick={() => setOpen(false)}
            className="btn-primary mt-4 flex w-full"
          >
            Cotizar mi evento
          </Link>
        </nav>
      )}
    </header>
  );
}
