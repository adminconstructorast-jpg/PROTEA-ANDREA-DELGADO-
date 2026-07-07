import Image from 'next/image';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { Reveal } from '@/components/Reveal';
import { SERVICE_LABELS } from '@protea/shared';
import { HERO_IMAGE, DETAIL_IMAGE_1, PORTFOLIO_PHOTOS } from '@/lib/portfolio-images';

const FEATURED_SERVICES = [
  {
    key: 'full_planning',
    icon: '✦',
    desc: 'Acompañamiento de principio a fin: concepto, proveedores, logística y coordinación del gran día.',
  },
  {
    key: 'floral_design',
    icon: '❁',
    desc: 'Diseño floral y ambientación a medida, con estética editorial y detalle artesanal.',
  },
  {
    key: 'guest_management',
    icon: '✓',
    desc: 'Confirmaciones inteligentes por WhatsApp, seating y control de asistencia en tiempo real.',
  },
] as const;

const TESTIMONIALS = [
  {
    quote:
      'Andrea entendió nuestra visión desde la primera reunión. Cada detalle, desde las flores hasta el itinerario, se sintió absolutamente nosotros.',
    name: 'Valeria & Emiliano',
    context: 'Boda · San Miguel de Allende',
  },
  {
    quote:
      'La coordinación del día del evento fue impecable. El equipo de Andrea Delgado resolvió todo con una calidez que se sintió en cada momento.',
    name: 'Renata',
    context: 'Evento corporativo · CDMX',
  },
  {
    quote:
      'El sistema de confirmaciones por WhatsApp nos ahorró semanas de trabajo — sabíamos exactamente quién venía en tiempo real.',
    name: 'Sofía & Daniel',
    context: 'Boda de destino · Riviera Maya',
  },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={HERO_IMAGE}
            alt="Salón de eventos decorado por Andrea Delgado"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-cream via-cream/85 to-cream/30" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 py-28 md:py-40">
          <Reveal>
            <p className="eyebrow">Wedding &amp; Event Planning</p>
          </Reveal>
          <Reveal delay={100}>
            <h1 className="mt-6 max-w-2xl font-serif text-5xl leading-[1.05] md:text-7xl">
              Eventos memorables, diseñados con intención.
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-6 max-w-lg text-lg text-ink/70">
              Acompañamos a cada pareja y anfitrión para crear experiencias impecables —
              del primer boceto al último brindis.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/cotizar" className="btn-primary">
                Cotizar mi evento
              </Link>
              <Link href="/#portafolio" className="btn-ghost bg-cream/60 backdrop-blur">
                Ver portafolio
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Servicios */}
      <section id="servicios" className="border-t border-sand bg-white/50">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <Reveal>
            <p className="eyebrow">Lo que hacemos</p>
            <h2 className="mt-3 font-serif text-4xl">Servicios</h2>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {FEATURED_SERVICES.map((s, i) => (
              <Reveal key={s.key} delay={i * 100}>
                <div className="card h-full transition hover:-translate-y-1 hover:shadow-md">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-terracotta/10 text-lg text-terracotta">
                    {s.icon}
                  </span>
                  <h3 className="mt-5 font-serif text-xl">{SERVICE_LABELS[s.key]}</h3>
                  <p className="mt-3 text-sm text-ink/70">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Portafolio */}
      <section id="portafolio" className="border-t border-sand">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <Reveal>
            <p className="eyebrow">Momentos</p>
            <h2 className="mt-3 font-serif text-4xl">Portafolio</h2>
            <p className="mt-3 max-w-lg text-ink/60">
              Una muestra de los eventos que hemos tenido el honor de crear.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PORTFOLIO_PHOTOS.map((p, i) => (
              <Reveal key={p.id} delay={i * 80}>
                <div className="group cursor-default">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-sand">
                    <Image
                      src={p.url}
                      alt={p.title}
                      fill
                      className="object-cover transition duration-700 group-hover:scale-105"
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                  </div>
                  <p className="mt-3 font-serif text-lg">{p.title}</p>
                  <p className="text-xs uppercase tracking-luxe text-gold">{p.tag}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Nosotros */}
      <section id="nosotros" className="border-t border-sand bg-white/50">
        <div className="mx-auto max-w-2xl px-6 py-20 text-center md:py-28">
          <Reveal>
            <p className="eyebrow">Sobre Andrea</p>
            <p className="mt-4 font-script text-5xl text-terracotta">Andrea Delgado</p>
            <h2 className="mt-4 font-serif text-4xl">
              Cada evento merece un relato propio.
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-ink/70">
              Con años de experiencia diseñando bodas y eventos de alto perfil, Andrea
              Delgado combina visión estética, precisión logística y calidez humana para
              transformar cada celebración en una experiencia inolvidable — sin perder de
              vista el detalle más pequeño.
            </p>
            <div className="mx-auto mt-10 grid max-w-xs grid-cols-2 gap-6 border-t border-sand pt-6">
              <div>
                <p className="font-serif text-3xl text-terracotta">150+</p>
                <p className="text-sm text-ink/60">Eventos realizados</p>
              </div>
              <div>
                <p className="font-serif text-3xl text-terracotta">10+</p>
                <p className="text-sm text-ink/60">Años de experiencia</p>
              </div>
            </div>
            <Link
              href="https://www.instagram.com/andreadelgadoplanner/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 text-sm text-terracotta underline"
            >
              Síguenos en Instagram @andreadelgadoplanner
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Testimonios */}
      <section className="border-t border-sand">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <Reveal>
            <p className="eyebrow text-center">Lo que dicen</p>
            <h2 className="mt-3 text-center font-serif text-4xl">Historias que celebramos</h2>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 100}>
                <div className="card h-full">
                  <p className="font-serif text-3xl leading-none text-clay/50">&ldquo;</p>
                  <p className="mt-2 text-sm text-ink/80">{t.quote}</p>
                  <p className="mt-5 font-script text-2xl text-terracotta">{t.name}</p>
                  <p className="text-xs uppercase tracking-luxe text-gold">{t.context}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final con detalle visual */}
      <section className="relative overflow-hidden border-t border-sand bg-protea-700 text-cream">
        <div className="absolute inset-0 opacity-15">
          <Image src={DETAIL_IMAGE_1} alt="" fill className="object-cover" sizes="100vw" />
        </div>
        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center">
          <Reveal>
            <p className="text-xs uppercase tracking-luxe text-cream/60">Andrea Delgado</p>
            <h2 className="mt-4 font-serif text-4xl md:text-5xl">
              Cada evento es una historia. Contémosla juntos.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-cream/80">
              Cuéntanos tu visión y recibe una propuesta personalizada en minutos con
              nuestro cotizador inteligente.
            </p>
            <Link
              href="/cotizar"
              className="mt-10 inline-flex btn-primary bg-cream text-ink hover:bg-sand"
            >
              Comenzar cotización
            </Link>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
