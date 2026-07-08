'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  COLLECTIONS,
  EVENT_TYPE_LABELS,
  type EventDoc,
} from '@protea/shared';

/** Listado operativo de eventos contratados. */
export default function EventosPage() {
  const [events, setEvents] = useState<EventDoc[]>([]);

  useEffect(() => {
    const q = query(collection(db, COLLECTIONS.EVENTS), orderBy('date', 'asc'));
    return onSnapshot(q, (snap) => {
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as EventDoc));
    });
  }, []);

  return (
    <div>
      <p className="eyebrow">Operación</p>
      <h1 className="mt-1 font-serif text-4xl">Eventos</h1>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((e) => (
          <div key={e.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif text-xl">{e.name}</h3>
                <p className="text-xs uppercase tracking-luxe text-gold">
                  {EVENT_TYPE_LABELS[e.type]}
                </p>
              </div>
              <span className="rounded-full bg-protea-50 px-2 py-0.5 text-xs text-protea-700">
                {e.status}
              </span>
            </div>
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-sand">
              <div
                className="h-full rounded-full bg-terracotta"
                style={{ width: `${e.progressPercent ?? 0}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-ink/50">{e.progressPercent ?? 0}% de avance</p>
          </div>
        ))}
        {events.length === 0 && (
          <p className="text-ink/40">Aún no hay eventos registrados.</p>
        )}
      </div>
    </div>
  );
}
