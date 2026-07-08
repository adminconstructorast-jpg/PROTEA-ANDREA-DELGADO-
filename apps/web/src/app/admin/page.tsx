'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  COLLECTIONS,
  EVENT_TYPE_LABELS,
  LEAD_STATUS_LABELS,
  type Lead,
} from '@protea/shared';

/** Dashboard central de la planner: resumen de negocio y últimos leads. */
export default function AdminDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    const recentQuery = query(
      collection(db, COLLECTIONS.LEADS),
      orderBy('createdAt', 'desc'),
      limit(8),
    );
    const unsubRecent = onSnapshot(recentQuery, (snap) => {
      setLeads(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Lead));
    });

    const newQuery = query(collection(db, COLLECTIONS.LEADS), where('status', '==', 'new'));
    const unsubNew = onSnapshot(newQuery, (snap) => setNewCount(snap.size));

    return () => {
      unsubRecent();
      unsubNew();
    };
  }, []);

  return (
    <div>
      <p className="eyebrow">Panel de control</p>
      <h1 className="mt-1 font-serif text-4xl">Buen día, Andrea ✨</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Leads nuevos" value={newCount} href="/admin/leads" />
        <StatCard label="Eventos activos" value="—" href="/admin/eventos" />
        <StatCard label="Confirmaciones" value="En vivo" href="/admin/confirmaciones" />
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl">Últimos prospectos</h2>
          <Link href="/admin/leads" className="text-sm text-terracotta">
            Ver pipeline →
          </Link>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-sand bg-white/60">
          <table className="w-full text-sm">
            <thead className="bg-sand/50 text-left text-xs uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Evento</th>
                <th className="px-4 py-3">Invitados</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-sand/20">
                  <td className="px-4 py-3 font-medium">{lead.contact.fullName}</td>
                  <td className="px-4 py-3">{EVENT_TYPE_LABELS[lead.eventType]}</td>
                  <td className="px-4 py-3">{lead.guestCount}</td>
                  <td className="px-4 py-3">{lead.score ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-clay/10 px-2 py-0.5 text-xs text-clay">
                      {LEAD_STATUS_LABELS[lead.status]}
                    </span>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-ink/40">
                    Aún no hay prospectos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string | number;
  href: string;
}) {
  return (
    <Link href={href} className="card transition hover:border-clay">
      <p className="text-xs uppercase tracking-wide text-ink/50">{label}</p>
      <p className="mt-2 font-serif text-3xl">{value}</p>
    </Link>
  );
}
