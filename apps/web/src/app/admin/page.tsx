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
import { db, functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { AdminCalendar } from '@/components/admin/AdminCalendar';
import {
  COLLECTIONS,
  eventDisplayLabel,
  LEAD_STATUS_LABELS,
  type Lead,
  type EventDoc,
} from '@protea/shared';

/** `rsvpStats` lo agrega la Cloud Function `onGuestWritten` (no está en EventDoc). */
type EventWithStats = EventDoc & { rsvpStats?: { confirmedSeats?: number; confirmed?: number } };

/** Dashboard central de la planner: resumen de negocio y últimos leads. */
export default function AdminDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [newCount, setNewCount] = useState(0);
  const [activeEvents, setActiveEvents] = useState<number | null>(null);
  const [confirmations, setConfirmations] = useState<number | null>(null);
  const [generatingPdfLeadId, setGeneratingPdfLeadId] = useState<string | null>(null);
  const [pdfUrls, setPdfUrls] = useState<Record<string, string>>({});

  const handleGeneratePdf = async (leadId: string) => {
    setGeneratingPdfLeadId(leadId);
    try {
      const generateQuotePdfFn = httpsCallable<{ leadId: string }, { success: boolean; url: string }>(
        functions,
        'generateQuotePdf',
      );
      const res = await generateQuotePdfFn({ leadId });
      if (res.data.success && res.data.url) {
        setPdfUrls((prev) => ({ ...prev, [leadId]: res.data.url }));
      } else {
        alert('No se pudo generar la cotización. Inténtalo de nuevo.');
      }
    } catch (err: any) {
      console.error('Error generando PDF:', err);
      alert('Error en el servidor: ' + err.message);
    } finally {
      setGeneratingPdfLeadId(null);
    }
  };

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

    // Eventos activos (planeación o en curso) y total de confirmaciones en vivo.
    const unsubEvents = onSnapshot(collection(db, COLLECTIONS.EVENTS), (snap) => {
      const events = snap.docs.map((d) => d.data() as EventWithStats);
      setActiveEvents(
        events.filter((e) => e.status === 'planning' || e.status === 'in_progress').length,
      );
      setConfirmations(
        events.reduce(
          (sum, e) => sum + (e.rsvpStats?.confirmedSeats ?? e.rsvpStats?.confirmed ?? 0),
          0,
        ),
      );
    });

    return () => {
      unsubRecent();
      unsubNew();
      unsubEvents();
    };
  }, []);

  return (
    <div>
      <p className="eyebrow">Panel de control</p>
      <h1 className="mt-1 font-serif text-4xl">Buen día, Andrea ✨</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Leads nuevos" value={newCount} href="/admin/leads" />
        <StatCard
          label="Eventos activos"
          value={activeEvents ?? '…'}
          href="/admin/eventos"
        />
        <StatCard
          label="Confirmaciones"
          value={confirmations ?? '…'}
          href="/admin/confirmaciones"
        />
      </div>

      {/* Agenda del mes (calendario compacto; la vista completa vive en /admin/calendario). */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl">Agenda del mes</h2>
          <Link href="/admin/calendario" className="text-sm text-terracotta">
            Ver calendario →
          </Link>
        </div>
        <div className="mt-4">
          <AdminCalendar compact />
        </div>
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
                <th className="px-4 py-3 text-right">Cotización</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-sand/20">
                  <td className="px-4 py-3 font-medium">{lead.contact.fullName}</td>
                  <td className="px-4 py-3">{eventDisplayLabel(lead.eventType, lead.eventSubtype)}</td>
                  <td className="px-4 py-3">{lead.guestCount}</td>
                  <td className="px-4 py-3">{lead.score ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-clay/10 px-2 py-0.5 text-xs text-clay">
                      {LEAD_STATUS_LABELS[lead.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {pdfUrls[lead.id] ? (
                      <a
                        href={pdfUrls[lead.id]}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-gold hover:underline"
                      >
                        📄 Descargar PDF
                      </a>
                    ) : (
                      <button
                        onClick={() => handleGeneratePdf(lead.id)}
                        disabled={generatingPdfLeadId !== null}
                        className="text-xs font-medium text-terracotta hover:underline disabled:opacity-50"
                      >
                        {generatingPdfLeadId === lead.id ? 'Generando...' : '⚙️ Generar'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink/40">
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
