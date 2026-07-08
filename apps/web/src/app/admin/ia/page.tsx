'use client';

import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

const KINDS = [
  { id: 'instagram_caption', label: 'Copy de Instagram' },
  { id: 'design_ideas', label: 'Ideas de diseño' },
  { id: 'itinerary_draft', label: 'Borrador de itinerario' },
] as const;

/** Estudio de IA: generación de contenido de marketing y operación. */
export default function IaStudioPage() {
  const [kind, setKind] = useState<(typeof KINDS)[number]['id']>('instagram_caption');
  const [brief, setBrief] = useState('');
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);

  async function generate() {
    if (!brief.trim()) return;
    setBusy(true);
    setResult('');
    try {
      const fn = httpsCallable(functions, 'generateContent');
      const res = (await fn({ kind, brief })) as { data: { content: string } };
      setResult(res.data.content);
    } catch (err) {
      setResult('No se pudo generar el contenido. Inténtalo de nuevo.');
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="eyebrow">Motor de IA</p>
      <h1 className="mt-1 font-serif text-4xl">Estudio de contenido</h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card">
          <label className="text-sm font-medium">Tipo de contenido</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {KINDS.map((k) => (
              <button
                key={k.id}
                onClick={() => setKind(k.id)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  kind === k.id ? 'border-terracotta bg-terracotta/5' : 'border-sand'
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>

          <label className="mt-6 block text-sm font-medium">Brief</label>
          <textarea
            className="input mt-2 min-h-32"
            placeholder="Ej. Boda en hacienda, paleta terracota y verde olivo, 180 invitados, estilo bohemio-elegante..."
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
          />
          <button onClick={() => void generate()} disabled={busy} className="btn-primary mt-4 w-full">
            {busy ? 'Generando…' : 'Generar con IA'}
          </button>
        </div>

        <div className="card">
          <h3 className="font-serif text-xl">Resultado</h3>
          <div className="mt-4 whitespace-pre-wrap text-sm text-ink/80">
            {result || <span className="text-ink/30">El contenido generado aparecerá aquí.</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
