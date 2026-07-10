import { ModulePlaceholder } from '@/components/admin/ModulePlaceholder';

export const metadata = { title: 'Correo · PROTEA Admin' };

export default function CorreoPage() {
  return (
    <ModulePlaceholder
      eyebrow="Comunicación"
      title="Correo"
      description="El correo del negocio conectado al CRM: cada mensaje, ligado a su cliente y su evento."
      bullets={[
        'Bandeja de correos enviados a prospectos y clientes.',
        'Plantillas con la identidad de PROTEA.',
        'Seguimiento de aperturas y respuestas.',
      ]}
    />
  );
}
