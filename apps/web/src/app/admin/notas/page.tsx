import { ModulePlaceholder } from '@/components/admin/ModulePlaceholder';

export const metadata = { title: 'Notas · PROTEA Admin' };

export default function NotasPage() {
  return (
    <ModulePlaceholder
      eyebrow="Operación"
      title="Notas"
      description="El cuaderno interno del estudio: todo lo que no puede perderse entre llamadas y visitas."
      bullets={[
        'Notas por proyecto y por cliente, siempre a la mano.',
        'Recordatorios y pendientes del equipo.',
        'Historial de acuerdos tras cada reunión.',
      ]}
    />
  );
}
