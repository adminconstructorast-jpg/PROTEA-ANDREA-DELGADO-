import { AdminCalendar } from '@/components/admin/AdminCalendar';

export const metadata = { title: 'Calendario · PROTEA Admin' };

export default function CalendarioPage() {
  return (
    <>
      <p className="eyebrow">Agenda</p>
      <h1 className="mt-1 font-serif text-4xl">Calendario</h1>
      <p className="mt-2 text-sm text-ink/60">
        Todos los eventos contratados, en vista mensual o semanal.
      </p>
      <div className="mt-8">
        <AdminCalendar />
      </div>
    </>
  );
}
