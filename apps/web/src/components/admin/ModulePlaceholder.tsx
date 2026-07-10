/**
 * Maqueta elegante para módulos del ERP aún en preparación.
 * Mantiene la estructura de encabezado del panel y describe qué vivirá aquí.
 */
interface ModulePlaceholderProps {
  eyebrow: string;
  title: string;
  description: string;
  bullets?: string[];
}

export function ModulePlaceholder({ eyebrow, title, description, bullets }: ModulePlaceholderProps) {
  return (
    <>
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-1 font-serif text-4xl">{title}</h1>

      <div className="card mx-auto mt-10 max-w-xl text-center">
        <span className="inline-flex rounded-full bg-peach/60 px-3 py-1 text-xs uppercase tracking-luxe text-ink">
          Módulo en preparación
        </span>
        <p className="mt-5 text-ink/60">{description}</p>
        {bullets && bullets.length > 0 && (
          <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left text-sm text-ink/70">
            {bullets.map((b) => (
              <li key={b} className="flex gap-2.5">
                <span className="text-terracotta" aria-hidden>
                  ✦
                </span>
                {b}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
