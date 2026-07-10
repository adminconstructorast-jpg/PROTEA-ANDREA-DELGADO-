'use client';

import { AuthGate } from '@/components/auth/AuthGate';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

/** Layout del portal de la planner con navegación lateral (y drawer en móvil). */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate allow={['planner', 'staff']}>
      <div className="flex min-h-screen flex-col md:flex-row">
        <AdminSidebar />
        <main className="flex-1 bg-cream px-4 py-6 md:px-8 md:py-10">{children}</main>
      </div>
    </AuthGate>
  );
}
