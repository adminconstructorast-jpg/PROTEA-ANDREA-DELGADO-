'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS, type UserProfile, type UserRole } from '@protea/shared';

const ROLE_LABELS: Record<UserRole, string> = {
  planner: 'Planner / Administradora',
  staff: 'Equipo',
  client: 'Cliente',
};

const ROLE_BADGE: Record<UserRole, string> = {
  planner: 'bg-terracotta/10 text-terracotta',
  staff: 'bg-peach/60 text-ink',
  client: 'bg-sand text-ink/70',
};

/** Usuarios registrados en la plataforma (colección `users`, lectura de staff). */
export default function UsuariosPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, COLLECTIONS.USERS), (snap) => {
      setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as UserProfile));
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <>
      <p className="eyebrow">Equipo y accesos</p>
      <h1 className="mt-1 font-serif text-4xl">Usuarios</h1>
      <p className="mt-2 text-sm text-ink/60">
        Cuentas con acceso a la plataforma: clientas, clientes y equipo interno.
      </p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-sand bg-white/60">
        {loading ? (
          <p className="px-6 py-10 text-center text-sm text-ink/50">Cargando…</p>
        ) : users.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-ink/50">
            Aún no hay usuarios registrados.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-sand text-xs uppercase tracking-luxe text-ink/40">
              <tr>
                <th className="px-4 py-3 font-normal">Usuario</th>
                <th className="hidden px-4 py-3 font-normal sm:table-cell">Correo</th>
                <th className="px-4 py-3 font-normal">Rol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand/60">
              {users.map((u) => (
                <tr key={u.uid}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {u.photoURL ? (
                        <Image
                          src={u.photoURL}
                          alt=""
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-peach font-serif text-sm text-ink">
                          {(u.displayName || u.email || '?').charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div>
                        <p className="font-medium">{u.displayName || 'Sin nombre'}</p>
                        <p className="text-xs text-ink/50 sm:hidden">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-ink/70 sm:table-cell">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs ${
                        u.role ? ROLE_BADGE[u.role] : 'bg-sand text-ink/50'
                      }`}
                    >
                      {u.role ? ROLE_LABELS[u.role] : 'Sin rol'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
