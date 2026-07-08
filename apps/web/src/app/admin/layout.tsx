'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthGate } from '@/components/auth/AuthGate';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/lib/auth-context';

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/leads', label: 'Pipeline (CRM)' },
  { href: '/admin/eventos', label: 'Eventos' },
  { href: '/admin/confirmaciones', label: 'Confirmaciones' },
  { href: '/admin/ia', label: 'Estudio IA' },
];

/** Layout del portal de la planner con navegación lateral. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate allow={['planner', 'staff']}>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 bg-cream px-8 py-10">{children}</main>
      </div>
    </AuthGate>
  );
}

function Sidebar() {
  const pathname = usePathname();
  const { signOut, user } = useAuth();

  return (
    <aside className="hidden w-64 flex-col border-r border-sand bg-white/60 p-6 md:flex">
      <Link href="/" className="mb-10 block">
        <Logo height={34} />
      </Link>
      <nav className="flex-1 space-y-1">
        {NAV.map((item) => {
          const active =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm transition ${
                active ? 'bg-terracotta/10 text-terracotta' : 'text-ink/70 hover:bg-sand'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-6 border-t border-sand pt-4">
        <p className="truncate text-xs text-ink/50">{user?.email}</p>
        <button onClick={() => void signOut()} className="mt-2 text-sm text-terracotta">
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
