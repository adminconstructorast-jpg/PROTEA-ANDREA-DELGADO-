import { ModulePlaceholder } from '@/components/admin/ModulePlaceholder';

export const metadata = { title: 'Chats · PROTEA Admin' };

export default function ChatsPage() {
  return (
    <ModulePlaceholder
      eyebrow="Comunicación"
      title="Chats"
      description="Las conversaciones de WhatsApp del negocio, en tiempo real y sin salir del panel."
      bullets={[
        'Bandeja de conversaciones con prospectos e invitados.',
        'Historial completo por contacto (la base ya existe: waConversations).',
        'Respuestas rápidas con la voz de la marca.',
      ]}
    />
  );
}
