'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const WELCOME: ChatMessage = {
  role: 'assistant',
  content:
    '¡Hola! Soy el asistente de PROTEA. Puedo resolver dudas sobre servicios, proceso y logística de tu evento. ¿En qué te ayudo?',
};

/** Mensaje amable cuando el asistente no está disponible (p. ej. IA sin configurar). */
const FALLBACK =
  'Por el momento no puedo responder en línea, pero Andrea sí: cuéntanos de tu evento en el cotizador y te contactamos muy pronto.';

/**
 * Burbuja de chat flotante del sitio público.
 * Conversa con el Cloud Function `chatWithAssistant` (Claude + FAQ de la firma);
 * si el backend no está disponible degrada a una invitación al cotizador.
 */
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Autoscroll al último mensaje.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open, sending]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    const history: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(history);
    setSending(true);
    try {
      const chat = httpsCallable(functions, 'chatWithAssistant');
      // El backend solo necesita el historial breve (recorta a 12 por su cuenta).
      const res = await chat({ messages: history.filter((m) => m !== WELCOME) });
      const reply = (res.data as { reply?: string })?.reply?.trim();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: reply || FALLBACK },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: FALLBACK }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[28rem] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-3xl border border-sand bg-cream shadow-2xl shadow-ink/20">
          {/* Encabezado */}
          <div className="flex items-center justify-between border-b border-sand bg-protea-700 px-5 py-4 text-cream">
            <div>
              <p className="font-serif text-lg leading-none">Asistente PROTEA</p>
              <p className="mt-1 text-xs text-cream/70">Dudas sobre tu evento, al instante</p>
            </div>
            <button
              type="button"
              aria-label="Cerrar chat"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-cream/80 transition hover:bg-cream/10"
            >
              ✕
            </button>
          </div>

          {/* Mensajes */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
              >
                <div
                  className={
                    m.role === 'user'
                      ? 'max-w-[85%] rounded-2xl rounded-br-sm bg-terracotta px-4 py-2.5 text-sm text-cream'
                      : 'max-w-[85%] rounded-2xl rounded-bl-sm border border-sand bg-white/70 px-4 py-2.5 text-sm text-ink/90'
                  }
                >
                  {m.content}
                  {m.role === 'assistant' && m.content === FALLBACK && (
                    <Link
                      href="/cotizar"
                      className="mt-2 block text-sm font-medium text-terracotta underline underline-offset-2"
                    >
                      Ir al cotizador →
                    </Link>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm border border-sand bg-white/70 px-4 py-2.5 text-sm text-ink/50">
                  Escribiendo…
                </div>
              </div>
            )}
          </div>

          {/* Entrada */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="flex items-center gap-2 border-t border-sand bg-white/60 px-3 py-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta…"
              aria-label="Mensaje para el asistente"
              className="min-w-0 flex-1 rounded-full border border-sand bg-cream px-4 py-2 text-sm outline-none transition focus:border-clay"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-terracotta text-cream transition hover:bg-clay disabled:opacity-40"
              aria-label="Enviar"
            >
              ↑
            </button>
          </form>
        </div>
      )}

      {/* Botón flotante */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Cerrar asistente' : 'Abrir asistente'}
        aria-expanded={open}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-protea-700 text-2xl text-cream shadow-lg shadow-ink/25 transition hover:scale-105"
      >
        {open ? '✕' : '✦'}
      </button>
    </div>
  );
}
