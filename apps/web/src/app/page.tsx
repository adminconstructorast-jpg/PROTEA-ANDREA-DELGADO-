import Image from 'next/image';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { Reveal } from '@/components/Reveal';
import { ChatWidget } from '@/components/ChatWidget';
import { PortfolioGallery } from '@/components/PortfolioGallery';
import { HERO_IMAGE, CATEGORY_META, PORTFOLIO_IMAGES } from '@/lib/portfolio';

const CTA_IMAGE = PORTFOLIO_IMAGES[1]?.src ?? HERO_IMAGE;

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      {/* ── Hero: imagen inmersiva a pantalla completa ────────────────────── */}
      <section id="inicio" className="relative flex min-h-[92vh] items-center justify-center overflow-hidden">
        <Image
          src={HERO_IMAGE}
          alt="Evento diseñado por Andrea Delgado"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        {/* Velo para legibilidad del texto sobre la foto. */}
        <div className="absolute inset-0 bg-gradient-to-b from-ink/45 via-ink/30 to-ink/60" />

        <div className="relative mx-auto max-w-3xl px-6 py-32 text-center text-cream">
          <Reveal>
            <p className="text-xs uppercase tracking-luxe text-cream/75">
              Wedding &amp; Event Planning
            </p>
          </Reveal>
          <Reveal delay={120}>
            <h1 className="mt-6 text-balance font-serif text-4xl leading-[1.08] sm:text-5xl md:text-6xl">
              Eventos memorables, diseñados con intención.
            </h1>
          </Reveal>
          <Reveal delay={240}>
            <p className="mx-auto mt-6 max-w-xl text-base text-cream/80 md:text-lg">
              Acompañamos a cada pareja y anfitrión para transformar una visión en una
              experiencia impecable — del primer boceto al último brindis.
            </p>
          </Reveal>
          <Reveal delay={360}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link href="/cotizar" className="btn-primary">
                Cotizar mi evento
              </Link>
              <Link
                href="#servicios"
                className="inline-flex items-center justify-center rounded-full border border-cream/50 px-7 py-3 text-sm font-medium text-cream transition hover:bg-cream/10"
              >
                Ver portafolio
              </Link>
            </div>
          </Reveal>
        </div>

        {/* Indicador de scroll. */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-cream/60" aria-hidden>
          <span className="block h-10 w-px bg-cream/40" />
        </div>
      </section>

      {/* ── Nosotros ───────────────────────────────────────────────────────── */}
      <section id="nosotros" className="border-b border-sand">
        <div className="mx-auto max-w-2xl px-6 py-24 text-center md:py-32">
          <Reveal>
            <p className="eyebrow">Sobre Andrea</p>
            <p className="mt-4 font-script text-5xl text-terracotta">Andrea Delgado</p>
            <h2 className="mt-5 text-balance font-serif text-3xl leading-tight md:text-4xl">
              Cada celebración merece un relato propio.
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-ink/70">
              Con más de una década diseñando bodas y eventos de alto perfil, Andrea Delgado
              combina visión estética, precisión logística y calidez humana para cuidar cada
              detalle — desde el concepto hasta el último invitado que se despide.
            </p>
            <div className="mx-auto mt-12 grid max-w-sm grid-cols-2 gap-8 border-t border-sand pt-8">
              <div>
                <p className="font-serif text-4xl text-terracotta">150+</p>
                <p className="mt-1 text-sm text-ink/60">Eventos realizados</p>
              </div>
              <div>
                <p className="font-serif text-4xl text-terracotta">10+</p>
                <p className="mt-1 text-sm text-ink/60">Años de experiencia</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Servicios: tres verticales ─────────────────────────────────────── */}
      <section id="servicios" className="border-b border-sand bg-white/50">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <Reveal>
            <div className="max-w-2xl">
              <p className="eyebrow">Lo que diseñamos</p>
              <h2 className="mt-3 font-serif text-3xl md:text-4xl">Servicios</h2>
              <p className="mt-4 text-ink/60">
                Un mismo estándar de detalle para tres formas de celebrar.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-sand bg-sand md:grid-cols-3">
            {CATEGORY_META.map((c, i) => (
              <Reveal key={c.key} delay={i * 100}>
                <div className="flex h-full flex-col bg-cream p-8 md:p-10">
                  <span className="font-serif text-sm text-gold">0{i + 1}</span>
                  <h3 className="mt-4 font-serif text-2xl">{c.label}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink/70">{c.blurb}</p>
                  <Link
                    href="#portafolio"
                    className="mt-6 inline-flex items-center gap-2 text-sm text-terracotta transition hover:gap-3"
                  >
                    Ver trabajo <span aria-hidden>→</span>
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Portafolio: grid editorial por categoría ───────────────────────── */}
      <section id="portafolio" className="border-b border-sand">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <Reveal>
            <div className="max-w-2xl">
              <p className="eyebrow">Momentos</p>
              <h2 className="mt-3 font-serif text-3xl md:text-4xl">Portafolio</h2>
              <p className="mt-4 text-ink/60">
                Una selección de los eventos que hemos tenido el honor de crear.
                Filtra por tipo de celebración.
              </p>
            </div>
          </Reveal>

          <PortfolioGallery />
        </div>
      </section>

      {/* ── Feature: Gestión de Invitados (RSVP + seating) ─────────────────── */}
      <section className="border-b border-sand bg-protea-700 text-cream">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 md:grid-cols-2 md:items-center md:py-28">
          <Reveal>
            <div>
              <p className="text-xs uppercase tracking-luxe text-cream/60">Tecnología a tu favor</p>
              <h2 className="mt-4 text-balance font-serif text-3xl leading-tight md:text-4xl">
                Gestión de invitados, sin hojas de cálculo.
              </h2>
              <p className="mt-5 max-w-md text-cream/80">
                Cada evento incluye nuestra plataforma de confirmaciones: tus invitados responden
                por WhatsApp y tú ves la asistencia, el menú y el acomodo de mesas actualizándose
                en tiempo real.
              </p>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <ul className="grid gap-4">
              {[
                ['Confirmaciones por WhatsApp', 'Invitaciones y recordatorios automáticos; los invitados confirman con un toque.'],
                ['Seating en tiempo real', 'Organiza mesas y acompañantes con un tablero que se actualiza al instante.'],
                ['Tablero en vivo', 'Asistencia, restricciones alimenticias y avances del evento, siempre a la mano.'],
              ].map(([title, desc]) => (
                <li key={title} className="rounded-2xl border border-cream/15 bg-cream/[0.06] p-5">
                  <p className="font-serif text-lg">{title}</p>
                  <p className="mt-1 text-sm text-cream/70">{desc}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ── Contacto: banner previo al footer ──────────────────────────────── */}
      <section id="contacto" className="relative overflow-hidden">
        <Image src={CTA_IMAGE} alt="" fill className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-ink/70" />
        <div className="relative mx-auto max-w-3xl px-6 py-28 text-center text-cream md:py-36">
          <Reveal>
            <p className="text-xs uppercase tracking-luxe text-cream/60">Contacto</p>
            <h2 className="mt-5 text-balance font-serif text-3xl leading-tight md:text-5xl">
              ¿Están listos para ver su sueño hecho realidad? Comencemos a planear juntos.
            </h2>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link href="/cotizar" className="btn-primary bg-cream text-ink hover:bg-sand">
                Cotizar mi evento
              </Link>
              <Link
                href="https://www.instagram.com/andreadelgadoplanner/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-cream/50 px-7 py-3 text-sm font-medium text-cream transition hover:bg-cream/10"
              >
                @andreadelgadoplanner
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
      <ChatWidget />
    </>
  );
}
