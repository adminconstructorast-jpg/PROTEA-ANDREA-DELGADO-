'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import {
  CATEGORY_META,
  imagesByCategory,
  type PortfolioCategory,
} from '@/lib/portfolio';

/** Cuántas fotos se muestran antes de "Ver más". */
const INITIAL_COUNT = 9;

/**
 * Galería del portafolio con filtros por categoría (Bodas · Eventos sociales ·
 * Eventos corporativos). Muestra un subconjunto y expande bajo demanda para no
 * volcar todas las fotos de golpe. Las categorías sin fotos aparecen como
 * "Próximamente" sin romper la estructura de tres verticales.
 */
export function PortfolioGallery() {
  // Conteo por categoría (memoizado; el JSON es estático).
  const counts = useMemo(
    () =>
      Object.fromEntries(
        CATEGORY_META.map((c) => [c.key, imagesByCategory(c.key).length]),
      ) as Record<PortfolioCategory, number>,
    [],
  );

  // Arranca en la primera categoría con fotos.
  const firstPopulated =
    CATEGORY_META.find((c) => counts[c.key] > 0)?.key ?? CATEGORY_META[0].key;
  const [active, setActive] = useState<PortfolioCategory>(firstPopulated);
  const [expanded, setExpanded] = useState(false);

  const images = imagesByCategory(active);
  const shown = expanded ? images : images.slice(0, INITIAL_COUNT);
  const activeMeta = CATEGORY_META.find((c) => c.key === active)!;

  function select(key: PortfolioCategory) {
    if (key === active) return;
    setActive(key);
    setExpanded(false);
  }

  return (
    <div className="mt-12">
      {/* Filtros por categoría */}
      <div className="flex flex-wrap gap-3">
        {CATEGORY_META.map((c) => {
          const count = counts[c.key];
          const isActive = c.key === active;
          const disabled = count === 0;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => !disabled && select(c.key)}
              disabled={disabled}
              aria-pressed={isActive}
              className={[
                'rounded-full border px-5 py-2 text-sm transition',
                isActive
                  ? 'border-terracotta bg-terracotta text-cream'
                  : disabled
                    ? 'cursor-not-allowed border-sand/70 text-ink/35'
                    : 'border-sand text-ink/70 hover:border-terracotta hover:text-terracotta',
              ].join(' ')}
            >
              {c.label}
              {disabled ? (
                <span className="ml-2 text-xs uppercase tracking-luxe">pronto</span>
              ) : (
                <span className={`ml-2 text-xs ${isActive ? 'text-cream/70' : 'text-gold'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Descripción de la categoría activa */}
      <p className="mt-6 max-w-xl text-sm leading-relaxed text-ink/60">{activeMeta.blurb}</p>

      {/* Grid de fotos (subconjunto expandible) */}
      {images.length > 0 ? (
        <>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {shown.map((img, i) => (
              <div
                key={img.src}
                className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-sand"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  loading={i < INITIAL_COUNT ? 'eager' : 'lazy'}
                  className="object-cover transition duration-700 group-hover:scale-105"
                  sizes="(min-width: 1024px) 33vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
              </div>
            ))}
          </div>

          {images.length > INITIAL_COUNT && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="inline-flex items-center gap-2 rounded-full border border-clay px-7 py-3 text-sm font-medium text-clay transition hover:bg-clay hover:text-cream"
              >
                {expanded
                  ? 'Ver menos'
                  : `Ver más (${images.length - INITIAL_COUNT})`}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="mt-8 rounded-3xl border border-dashed border-sand bg-white/40 px-6 py-16 text-center">
          <p className="font-serif text-2xl text-ink/70">Muy pronto</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink/50">
            Estamos preparando esta sección con nuevos eventos. Vuelve pronto para verla.
          </p>
        </div>
      )}
    </div>
  );
}
