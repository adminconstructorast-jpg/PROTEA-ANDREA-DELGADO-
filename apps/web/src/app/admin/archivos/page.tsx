import { ModulePlaceholder } from '@/components/admin/ModulePlaceholder';

export const metadata = { title: 'Archivos · PROTEA Admin' };

export default function ArchivosPage() {
  return (
    <ModulePlaceholder
      eyebrow="Operación"
      title="Archivos"
      description="El expediente digital de cada evento, organizado y compartible."
      bullets={[
        'Contratos, cotizaciones y anexos por evento.',
        'Moodboards y material de diseño.',
        'Documentos de proveedores y permisos del venue.',
      ]}
    />
  );
}
