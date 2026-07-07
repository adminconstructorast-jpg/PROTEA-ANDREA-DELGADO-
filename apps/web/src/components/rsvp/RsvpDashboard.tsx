'use client';

import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { db } from '@/lib/firebase';
import {
  COLLECTIONS,
  RSVP_STATUS_LABELS,
  type Guest,
  type RSVPStatus,
} from '@protea/shared';

interface RsvpStats {
  confirmed: number;
  pending: number;
  invited: number;
  declined: number;
  no_response: number;
  totalGuests: number;
  confirmedSeats: number;
  respondedPercent: number;
}

const STATUS_COLORS: Record<RSVPStatus, string> = {
  confirmed: '#5a7355',
  invited: '#a58e6f',
  pending: '#c98b6b',
  declined: '#b5674a',
  no_response: '#d8cdbb',
};

/**
 * Dashboard del Módulo de Confirmaciones en tiempo real.
 * Escucha el documento del evento (stats agregadas por Cloud Function) y la
 * subcolección de invitados vía onSnapshot para actualización instantánea.
 */
export function RsvpDashboard({ eventId }: { eventId: string }) {
  const [stats, setStats] = useState<RsvpStats | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [filter, setFilter] = useState<RSVPStatus | 'all'>('all');

  useEffect(() => {
    const unsubEvent = onSnapshot(doc(db, COLLECTIONS.EVENTS, eventId), (snap) => {
      const data = snap.data() as { rsvpStats?: RsvpStats } | undefined;
      if (data?.rsvpStats) setStats(data.rsvpStats);
    });

    const guestsQuery = query(
      collection(db, COLLECTIONS.EVENTS, eventId, COLLECTIONS.GUESTS),
      orderBy('fullName'),
    );
    const unsubGuests = onSnapshot(guestsQuery, (snap) => {
      setGuests(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Guest));
    });

    return () => {
      unsubEvent();
      unsubGuests();
    };
  }, [eventId]);

  const chartData = stats
    ? (['confirmed', 'invited', 'pending', 'declined', 'no_response'] as RSVPStatus[])
        .map((s) => ({ name: RSVP_STATUS_LABELS[s], value: stats[s] ?? 0, status: s }))
        .filter((d) => d.value > 0)
    : [];

  const filteredGuests =
    filter === 'all' ? guests : guests.filter((g) => g.rsvpStatus === filter);

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Confirmados" value={stats?.confirmed ?? 0} accent="#5a7355" />
        <Kpi label="Pendientes" value={(stats?.pending ?? 0) + (stats?.invited ?? 0)} accent="#c98b6b" />
        <Kpi label="No asistirán" value={stats?.declined ?? 0} accent="#b5674a" />
        <Kpi label="Lugares confirmados" value={stats?.confirmedSeats ?? 0} accent="#a58e6f" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gráfica */}
        <div className="card">
          <h3 className="font-serif text-xl">Estado de asistencia</h3>
          <div className="mt-4 h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-ink/40">
                Aún no hay invitados cargados.
              </div>
            )}
          </div>
          {stats && (
            <p className="mt-2 text-center text-sm text-ink/60">
              {stats.respondedPercent}% ha respondido · {stats.totalGuests} invitados
            </p>
          )}
        </div>

        {/* Lista de invitados */}
        <div className="card">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl">Invitados</h3>
            <select
              className="rounded-lg border border-sand bg-white px-2 py-1 text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value as RSVPStatus | 'all')}
            >
              <option value="all">Todos</option>
              {(Object.keys(RSVP_STATUS_LABELS) as RSVPStatus[]).map((s) => (
                <option key={s} value={s}>
                  {RSVP_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4 max-h-64 divide-y divide-sand overflow-y-auto">
            {filteredGuests.map((g) => (
              <div key={g.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium">{g.fullName}</p>
                  {g.groupName && <p className="text-xs text-ink/50">{g.groupName}</p>}
                </div>
                <span
                  className="rounded-full px-2 py-0.5 text-xs"
                  style={{
                    backgroundColor: `${STATUS_COLORS[g.rsvpStatus]}22`,
                    color: STATUS_COLORS[g.rsvpStatus],
                  }}
                >
                  {RSVP_STATUS_LABELS[g.rsvpStatus]}
                </span>
              </div>
            ))}
            {filteredGuests.length === 0 && (
              <p className="py-6 text-center text-sm text-ink/40">Sin invitados en este filtro.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="card">
      <p className="text-xs uppercase tracking-wide text-ink/50">{label}</p>
      <p className="mt-2 font-serif text-4xl" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}
