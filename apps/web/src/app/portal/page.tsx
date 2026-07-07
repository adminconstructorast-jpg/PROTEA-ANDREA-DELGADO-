'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { SiteHeader } from '@/components/SiteHeader';
import { AuthGate } from '@/components/auth/AuthGate';
import { RsvpDashboard } from '@/components/rsvp/RsvpDashboard';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { COLLECTIONS, EVENT_TYPE_LABELS, type EventDoc } from '@protea/shared';

/** Portal de clientes (novios/anfitriones): progreso y confirmaciones. */
export default function PortalPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <AuthGate>
          <ClientEvents />
        </AuthGate>
      </main>
    </>
  );
}

function ClientEvents() {
  const { user, signOut } = useAuth();
  const [events, setEvents] = useState<EventDoc[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const q = query(
        collection(db, COLLECTIONS.EVENTS),
        where('memberUids', 'array-contains', user.uid),
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as EventDoc);
      setEvents(list);
      setSelected(list[0]?.id ?? null);
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <p className="py-16 text-center text-ink/50">Cargando tu evento…</p>;

  if (events.length === 0) {
    return (
      <div className="py-16 text-center">
        <h2 className="font-serif text-2xl">Aún no hay eventos vinculados</h2>
        <p className="mt-3 text-ink/70">
          En cuanto Andrea configure tu evento, aparecerá aquí tu panel de progreso y
          confirmaciones.
        </p>
        <button onClick={() => void signOut()} className="mt-6 text-sm text-terracotta underline">
          Cerrar sesión
        </button>
      </div>
    );
  }

  const current = events.find((e) => e.id === selected);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Mi evento</p>
          <h1 className="mt-1 font-serif text-3xl">{current?.name}</h1>
          {current && (
            <p className="text-sm text-ink/60">
              {EVENT_TYPE_LABELS[current.type]} · {current.progressPercent}% de avance
            </p>
          )}
        </div>
        {events.length > 1 && (
          <select
            className="rounded-lg border border-sand bg-white px-3 py-2 text-sm"
            value={selected ?? ''}
            onChange={(e) => setSelected(e.target.value)}
          >
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {selected && <RsvpDashboard eventId={selected} />}
    </div>
  );
}
