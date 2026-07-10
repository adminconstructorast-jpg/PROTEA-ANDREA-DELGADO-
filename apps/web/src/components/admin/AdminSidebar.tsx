'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/lib/auth-context';

/**
 * Módulos del ERP de la planner. Los marcados como existentes ya tienen
 * funcionalidad real; el resto son maquetas listas para crecer.
 */
const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/calendario', label: 'Calendario' },
  { href: '/admin/leads', label: 'Clientes' },
  { href: '/admin/eventos', label: 'Proyectos' },
  { href: '/admin/confirmaciones', label: 'Messenger' },
  { href: '/admin/chats', label: 'Chats' },
  { href: '/admin/correo', label: 'Correo' },
  { href: '/admin/notas', label: 'Notas' },
  { href: '/admin/archivos', label: 'Archivos' },
  { href: '/admin/ia', label: 'Estudio IA' },
  { href: '/admin/usuarios', label: 'Usuarios' },
];

/** Enlaces de navegación compartidos por el sidebar de escritorio y el drawer móvil. */
function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-1">
      {NAV.map((item) => {
        const active =
          item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`block rounded-lg px-3 py-2 text-sm transition ${
              active ? 'bg-terracotta/10 text-terracotta' : 'text-ink/70 hover:bg-sand'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Bloque de sesión (correo del usuario + cerrar sesión). */
function SessionBlock() {
  const { signOut, user } = useAuth();
  return (
    <div className="mt-6 border-t border-sand pt-4">
      <p className="truncate text-xs text-ink/50">{user?.email}</p>
      <button onClick={() => void signOut()} className="mt-2 text-sm text-terracotta">
        Cerrar sesión
      </button>
    </div>
  );
}

/**
 * Navegación del panel: sidebar fijo en escritorio y header con drawer en
 * móvil (antes el panel no tenía navegación alguna bajo `md`).
 */
export function AdminSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ── Header móvil ── */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-sand bg-cream/95 px-4 py-3 backdrop-blur md:hidden">
        <Link href="/">
          <Logo height={28} />
        </Link>
        <button
          type="button"
          aria-label="Abrir menú"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-sand"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      {/* ── Drawer móvil ── */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-ink/30"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-cream p-6 shadow-2xl">
            <div className="mb-8 flex items-center justify-between">
              <Logo height={30} />
              <button
                type="button"
                aria-label="Cerrar menú"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-sand text-ink/70"
              >
                ✕
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
            <SessionBlock />
          </div>
        </div>
      )}

      {/* ── Sidebar escritorio ── */}
      <aside className="hidden w-64 flex-col border-r border-sand bg-white/60 p-6 md:flex">
        <Link href="/" className="mb-10 block">
          <Logo height={34} />
        </Link>
        <NavLinks />
        <SessionBlock />
      </aside>
    </>
  );
}
