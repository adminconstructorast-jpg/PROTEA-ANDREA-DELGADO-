'use client';

import { useEffect, useRef, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import * as XLSX from 'xlsx';
import { db, functions } from '@/lib/firebase';
import { RsvpDashboard } from '@/components/rsvp/RsvpDashboard';
import { COLLECTIONS, type EventDoc } from '@protea/shared';

/** Módulo de confirmaciones para la planner: RSVP en vivo + acciones. */
export default function ConfirmacionesPage() {
  const [events, setEvents] = useState<EventDoc[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const snap = await getDocs(query(collection(db, COLLECTIONS.EVENTS), orderBy('date', 'desc')));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as EventDoc);
      setEvents(list);
      if (list[0]) setSelected(list[0].id);
    })();
  }, []);

  async function launchCampaign(kind: 'save_the_date' | 'invitation' | 'reminder') {
    if (!selected) return;
    setBusy(kind);
    setFeedback(null);
    try {
      const fn = httpsCallable(functions, 'sendRsvpCampaign');
      const res = (await fn({ eventId: selected, kind })) as {
        data: { sent: number; failed: number };
      };
      setFeedback(`Campaña enviada: ${res.data.sent} enviados, ${res.data.failed} fallidos.`);
    } catch (err) {
      setFeedback('No se pudo enviar la campaña. Revisa la configuración de WhatsApp.');
      console.error(err);
    } finally {
      setBusy(null);
    }
  }

  async function handleImport(file: File) {
    if (!selected) return;
    setBusy('import');
    setFeedback(null);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const sheet = workbook.Sheets[workbook.SheetNames[0]!]!;
      const rows = XLSX.utils.sheet_to_json(sheet);

      const fn = httpsCallable(functions, 'importGuests');
      const res = (await fn({ eventId: selected, rows })) as {
        data: { imported: number; rejected: { row: number; reason: string }[] };
      };
      setFeedback(
        `Importados ${res.data.imported} invitados. ${res.data.rejected.length} filas rechazadas.`,
      );
    } catch (err) {
      setFeedback('No se pudo importar el archivo. Verifica el formato (columnas: nombre, telefono).');
      console.error(err);
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Módulo RSVP</p>
          <h1 className="mt-1 font-serif text-4xl">Confirmaciones</h1>
        </div>
        <select
          className="rounded-lg border border-sand bg-white px-3 py-2 text-sm"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </div>

      {/* Acciones */}
      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={() => void launchCampaign('save_the_date')} disabled={!!busy} className="btn-ghost">
          {busy === 'save_the_date' ? 'Enviando…' : '📅 Save the date'}
        </button>
        <button onClick={() => void launchCampaign('invitation')} disabled={!!busy} className="btn-primary">
          {busy === 'invitation' ? 'Enviando…' : '💌 Enviar invitaciones'}
        </button>
        <button onClick={() => void launchCampaign('reminder')} disabled={!!busy} className="btn-ghost">
          {busy === 'reminder' ? 'Enviando…' : '🔔 Recordatorio a pendientes'}
        </button>
        <button onClick={() => fileRef.current?.click()} disabled={!!busy} className="btn-ghost">
          {busy === 'import' ? 'Importando…' : '📥 Importar Excel/CSV'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleImport(f);
          }}
        />
      </div>

      {feedback && (
        <p className="mt-4 rounded-lg bg-protea-50 px-4 py-3 text-sm text-protea-700">{feedback}</p>
      )}

      <div className="mt-8">{selected && <RsvpDashboard eventId={selected} />}</div>
    </div>
  );
}
