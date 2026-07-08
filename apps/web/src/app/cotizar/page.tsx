import { SiteHeader } from '@/components/SiteHeader';
import { QuoteWizard } from '@/components/quote/QuoteWizard';

export const metadata = {
  title: 'Cotizador · Andrea Delgado',
  description: 'Recibe una propuesta personalizada para tu evento en minutos.',
};

export default function CotizarPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10 text-center">
          <p className="eyebrow">Cotizador inteligente</p>
          <h1 className="mt-3 font-serif text-4xl md:text-5xl">Diseñemos tu evento</h1>
          <p className="mx-auto mt-4 max-w-lg text-ink/70">
            Responde unos pocos pasos y prepararemos una propuesta a tu medida.
          </p>
        </div>
        <QuoteWizard />
      </main>
    </>
  );
}
