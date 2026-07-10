'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS, type EventDoc } from '@protea/shared';

/**
 * Calendario de eventos del negocio (vista mensual y semanal), construido a
 * mano con Date nativo — sin librerías. Lee la colección `events` en vivo y
 * pinta cada evento en su día. La semana inicia en lunes (convención MX).
 */
interface AdminCalendarProps {
  /** Modo compacto para el dashboard: solo mes, celdas bajas y puntos. */
  compact?: boolean;
}

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/** Clave de día en horario LOCAL (no UTC: toISOString desplazaría eventos nocturnos). */
function keyOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function sameDay(a: Date, b: Date): boolean {
  return keyOf(a) === keyOf(b);
}

/** Lunes de la semana a la que pertenece `d`. */
function startOfWeek(d: Date): Date {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (out.getDay() + 6) % 7; // 0 = lunes
  out.setDate(out.getDate() - dow);
  return out;
}

/** 42 celdas (6 semanas) del mes del cursor, iniciando en lunes. */
function buildMonthCells(cursor: Date): Date[] {
  const first = startOfWeek(new Date(cursor.getFullYear(), cursor.getMonth(), 1));
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(first);
    d.setDate(first.getDate() + i);
    return d;
  });
}

/** Los 7 días de la semana del cursor. */
function buildWeekCells(cursor: Date): Date[] {
  const first = startOfWeek(cursor);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(first);
    d.setDate(first.getDate() + i);
    return d;
  });
}

function monthTitle(cursor: Date): string {
  const s = cursor.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function AdminCalendar({ compact = false }: AdminCalendarProps) {
  const [cursor, setCursor] = useState(() => new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [events, setEvents] = useState<EventDoc[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, COLLECTIONS.EVENTS), (snap) => {
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as EventDoc));
    });
    return unsub;
  }, []);

  // Índice día → eventos (tolera docs sin fecha válida).
  const byDay = useMemo(() => {
    const map = new Map<string, EventDoc[]>();
    for (const e of events) {
      if (typeof e.date?.toDate !== 'function') continue;
      const k = keyOf(e.date.toDate());
      map.set(k, [...(map.get(k) ?? []), e]);
    }
    return map;
  }, [events]);

  const today = new Date();
  const cells = view === 'month' ? buildMonthCells(cursor) : buildWeekCells(cursor);

  function shift(dir: -1 | 1) {
    setCursor((c) =>
      view === 'month'
        ? new Date(c.getFullYear(), c.getMonth() + dir, 1)
        : new Date(c.getFullYear(), c.getMonth(), c.getDate() + dir * 7),
    );
  }

  const weekRange =
    view === 'week'
      ? `${cells[0]!.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} – ${cells[6]!.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`
      : null;

  return (
    <div className="rounded-2xl border border-sand bg-white/60 p-4 md:p-5">
      {/* Encabezado: título + navegación + toggle de vista */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="font-serif text-lg">
          {monthTitle(cursor)}
          {weekRange && <span className="ml-2 text-sm text-ink/50">({weekRange})</span>}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => shift(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-sand text-ink/70 transition hover:border-clay"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setCursor(new Date())}
            className="rounded-full border border-sand px-3 py-1 text-xs text-ink/70 transition hover:border-clay"
          >
            Hoy
          </button>
          <button
            type="button"
            aria-label="Siguiente"
            onClick={() => shift(1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-sand text-ink/70 transition hover:border-clay"
          >
            ›
          </button>
          {!compact && (
            <div className="ml-2 flex overflow-hidden rounded-full border border-sand text-xs">
              {(['month', 'week'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`px-3 py-1 transition ${
                    view === v ? 'bg-terracotta text-cream' : 'text-ink/60 hover:bg-sand'
                  }`}
                >
                  {v === 'month' ? 'Mes' : 'Semana'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Encabezado de días */}
      <div className="grid grid-cols-7 gap-px">
        {WEEKDAYS.map((d) => (
          <div key={d} className="pb-2 text-center text-[10px] uppercase tracking-luxe text-ink/40">
            {d}
          </div>
        ))}
      </div>

      {/* Celdas */}
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-sand bg-sand">
        {cells.map((day) => {
          const dayEvents = byDay.get(keyOf(day)) ?? [];
          const inMonth = view === 'week' || day.getMonth() === cursor.getMonth();
          const isToday = sameDay(day, today);
          const minH =
            view === 'week' ? 'min-h-48' : compact ? 'min-h-14' : 'min-h-24';
          return (
            <div key={keyOf(day)} className={`${minH} bg-white/70 p-1.5 ${inMonth ? '' : 'bg-white/40'}`}>
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  isToday
                    ? 'bg-terracotta font-medium text-cream'
                    : inMonth
                      ? 'text-ink/80'
                      : 'text-ink/30'
                }`}
              >
                {day.getDate()}
              </span>
              {/* Eventos del día */}
              {compact ? (
                dayEvents.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1 px-1">
                    {dayEvents.slice(0, 3).map((e) => (
                      <span key={e.id} title={e.name} className="h-1.5 w-1.5 rounded-full bg-terracotta" />
                    ))}
                  </div>
                )
              ) : (
                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, view === 'week' ? 6 : 2).map((e) => (
                    <span
                      key={e.id}
                      title={e.name}
                      className="block truncate rounded bg-terracotta/10 px-1.5 py-0.5 text-[11px] leading-tight text-terracotta"
                    >
                      {view === 'week' && (
                        <span className="mr-1 text-ink/50">
                          {e.date.toDate().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      {e.name}
                    </span>
                  ))}
                  {dayEvents.length > (view === 'week' ? 6 : 2) && (
                    <span className="block px-1.5 text-[10px] text-ink/40">
                      +{dayEvents.length - (view === 'week' ? 6 : 2)} más
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
