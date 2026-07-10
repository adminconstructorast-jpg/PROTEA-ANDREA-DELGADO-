'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  COLLECTIONS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  eventDisplayLabel,
  BUDGET_RANGE_LABELS,
  type Lead,
} from '@protea/shared';

/** Pipeline de ventas (CRM) tipo kanban por etapa. */
export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    const q = query(collection(db, COLLECTIONS.LEADS), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setLeads(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Lead));
    });
  }, []);

  return (
    <div>
      <p className="eyebrow">CRM</p>
      <h1 className="mt-1 font-serif text-4xl">Pipeline de ventas</h1>

      <div className="mt-8 flex gap-4 overflow-x-auto pb-4">
        {LEAD_STATUSES.map((status) => {
          const columnLeads = leads.filter((l) => l.status === status);
          return (
            <div key={status} className="w-72 flex-shrink-0">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium">{LEAD_STATUS_LABELS[status]}</h3>
                <span className="rounded-full bg-sand px-2 text-xs text-ink/60">
                  {columnLeads.length}
                </span>
              </div>
              <div className="space-y-3">
                {columnLeads.map((lead) => (
                  <div key={lead.id} className="card p-4">
                    <p className="font-medium">{lead.contact.fullName}</p>
                    <p className="mt-1 text-xs text-ink/60">
                      {eventDisplayLabel(lead.eventType, lead.eventSubtype)} · {lead.guestCount} inv.
                    </p>
                    <p className="mt-2 text-xs text-ink/50">
                      {BUDGET_RANGE_LABELS[lead.budgetRange]}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-gold">⭐ {lead.score ?? '—'}</span>
                      <a href={`tel:${lead.contact.phone}`} className="text-xs text-terracotta">
                        {lead.contact.phone}
                      </a>
                    </div>
                  </div>
                ))}
                {columnLeads.length === 0 && (
                  <p className="rounded-lg border border-dashed border-sand py-6 text-center text-xs text-ink/30">
                    Vacío
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
