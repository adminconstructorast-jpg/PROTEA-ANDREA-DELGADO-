'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import type { UserRole } from '@protea/shared';

/**
 * Guarda de acceso: muestra el formulario de login si no hay sesión y, si se
 * indican `allow`, restringe por rol. Envuelve el contenido protegido.
 */
export function AuthGate({
  allow,
  children,
}: {
  allow?: UserRole[];
  children: React.ReactNode;
}) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-ink/50">
        Cargando…
      </div>
    );
  }

  if (!user) return <LoginForm />;

  if (allow && role && !allow.includes(role)) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <h2 className="font-serif text-2xl">Acceso restringido</h2>
        <p className="mt-3 text-ink/70">
          Tu cuenta no tiene permiso para ver esta sección.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

function LoginForm() {
  const { signInWithGoogle, signInWithApple, signInWithEmail, registerWithEmail } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError('No se pudo iniciar sesión. Verifica tus datos.');
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-16">
      <div className="card">
        <p className="eyebrow text-center">Portal PROTEA</p>
        <h1 className="mt-2 text-center font-serif text-3xl">
          {mode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu acceso'}
        </h1>

        <div className="mt-8 space-y-3">
          <button
            onClick={() => run(signInWithGoogle)}
            disabled={busy}
            className="btn-ghost w-full"
          >
            Continuar con Google
          </button>
          <button
            onClick={() => run(signInWithApple)}
            disabled={busy}
            className="btn-ghost w-full"
          >
            Continuar con Apple
          </button>
        </div>

        <div className="my-6 flex items-center gap-3 text-xs text-ink/40">
          <div className="h-px flex-1 bg-sand" />o<div className="h-px flex-1 bg-sand" />
        </div>

        <div className="space-y-3">
          <input
            className="input"
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="input"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={() =>
              run(() =>
                mode === 'login'
                  ? signInWithEmail(email, password)
                  : registerWithEmail(email, password),
              )
            }
            disabled={busy}
            className="btn-primary w-full"
          >
            {mode === 'login' ? 'Iniciar sesión' : 'Registrarme'}
          </button>
        </div>

        {error && <p className="mt-4 text-center text-sm text-terracotta">{error}</p>}

        <p className="mt-6 text-center text-sm text-ink/60">
          {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-terracotta underline"
          >
            {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
          </button>
        </p>
      </div>
    </div>
  );
}
