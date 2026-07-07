import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { SERVICE_LABELS } from '@protea/shared';

const FEATURED_SERVICES = [
  { key: 'full_planning', desc: 'Acompañamiento de principio a fin: concepto, proveedores, logística y coordinación del gran día.' },
  { key: 'floral_design', desc: 'Diseño floral y ambientación a medida, con estética editorial y detalle artesanal.' },
  { key: 'guest_management', desc: 'Confirmaciones inteligentes por WhatsApp, seating y control de asistencia en tiempo real.' },
] as const;

const PORTFOLIO = [
  { title: 'Boda en Hacienda', tag: 'San Miguel de Allende' },
  { title: 'Evento Corporativo', tag: 'CDMX' },
  { title: 'Celebración Social', tag: 'Valle de Bravo' },
  { title: 'Boda de Destino', tag: 'Riviera Maya' },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <p className="eyebrow">Wedding &amp; Event Planning</p>
          <h1 className="mt-6 max-w-3xl font-serif text-5xl leading-[1.05] md:text-7xl">
            Eventos memorables, diseñados con intención.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink/70">
            En PROTEA acompañamos a cada pareja y anfitrión para crear experiencias
            impecables — del primer boceto al último brindis.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/cotizar" className="btn-primary">
              Cotizar mi evento
            </Link>
            <Link href="/#portafolio" className="btn-ghost">
              Ver portafolio
            </Link>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-32 -top-24 h-96 w-96 rounded-full bg-clay/20 blur-3xl" />
      </section>

      {/* Servicios */}
      <section id="servicios" className="border-t border-sand bg-white/50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="eyebrow">Lo que hacemos</p>
          <h2 className="mt-3 font-serif text-4xl">Servicios</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {FEATURED_SERVICES.map((s) => (
              <div key={s.key} className="card">
                <h3 className="font-serif text-xl">{SERVICE_LABELS[s.key]}</h3>
                <p className="mt-3 text-sm text-ink/70">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portafolio */}
      <section id="portafolio" className="border-t border-sand">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="eyebrow">Momentos</p>
          <h2 className="mt-3 font-serif text-4xl">Portafolio</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PORTFOLIO.map((p) => (
              <div key={p.title} className="group">
                <div className="aspect-[3/4] rounded-2xl bg-gradient-to-br from-sand to-clay/30 transition group-hover:from-clay/20 group-hover:to-protea-500/20" />
                <p className="mt-3 font-serif text-lg">{p.title}</p>
                <p className="text-xs uppercase tracking-luxe text-gold">{p.tag}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nosotros / CTA */}
      <section id="nosotros" className="border-t border-sand bg-protea-700 text-cream">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <p className="text-xs uppercase tracking-luxe text-cream/60">Andrea Delgado</p>
          <h2 className="mt-4 font-serif text-4xl md:text-5xl">
            Cada evento es una historia. Contémosla juntos.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-cream/80">
            Cuéntanos tu visión y recibe una propuesta personalizada en minutos con
            nuestro cotizador inteligente.
          </p>
          <Link href="/cotizar" className="mt-10 inline-flex btn-primary bg-cream text-ink hover:bg-sand">
            Comenzar cotización
          </Link>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
