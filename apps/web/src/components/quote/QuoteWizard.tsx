'use client';

import { useMemo, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import {
  QUOTE_WIZARD_STEPS,
  quoteStepEventSchema,
  quoteStepDateSchema,
  quoteStepVenueSchema,
  quoteStepServicesSchema,
  quoteStepContactSchema,
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
  EVENT_SUBTYPES,
  EVENT_SUBTYPE_LABELS,
  SERVICE_OPTIONS,
  SERVICE_LABELS,
  BUDGET_RANGES,
  BUDGET_RANGE_LABELS,
  type EventType,
  type EventSubtype,
  type ServiceOption,
  type BudgetRange,
} from '@protea/shared';

/** Estado acumulado del formulario a lo largo de los pasos. */
interface WizardData {
  eventType?: EventType;
  /** Ocasión específica; depende del tipo elegido. */
  eventSubtype?: EventSubtype;
  tentativeDate: string | null;
  dateIsFlexible: boolean;
  guestCount: string;
  hasVenue: boolean | null;
  venueName: string;
  city: string;
  budgetRange?: BudgetRange;
  services: ServiceOption[];
  message: string;
  fullName: string;
  email: string;
  phone: string;
  acceptsContact: boolean;
}

const INITIAL: WizardData = {
  tentativeDate: null,
  dateIsFlexible: false,
  guestCount: '',
  hasVenue: null,
  venueName: '',
  city: '',
  services: [],
  message: '',
  fullName: '',
  email: '',
  phone: '',
  acceptsContact: false,
};

type Errors = Record<string, string>;

export function QuoteWizard() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const progress = useMemo(
    () => Math.round(((step + 1) / QUOTE_WIZARD_STEPS.length) * 100),
    [step],
  );

  function patch(next: Partial<WizardData>) {
    setData((d) => ({ ...d, ...next }));
  }

  /** Valida el paso actual con su esquema Zod compartido. */
  function validateStep(): boolean {
    let result: { success: boolean; error?: { issues: { path: (string | number)[]; message: string }[] } };
    switch (step) {
      case 0:
        result = quoteStepEventSchema.safeParse({
          eventType: data.eventType,
          eventSubtype: data.eventSubtype,
        });
        break;
      case 1:
        result = quoteStepDateSchema.safeParse({
          tentativeDate: data.tentativeDate,
          dateIsFlexible: data.dateIsFlexible,
          guestCount: data.guestCount,
        });
        break;
      case 2:
        result = quoteStepVenueSchema.safeParse({
          hasVenue: data.hasVenue ?? false,
          venueName: data.venueName || undefined,
          city: data.city || undefined,
          budgetRange: data.budgetRange,
        });
        break;
      case 3:
        result = quoteStepServicesSchema.safeParse({
          services: data.services,
          message: data.message || undefined,
        });
        break;
      case 4:
        result = quoteStepContactSchema.safeParse({
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          acceptsContact: data.acceptsContact,
        });
        break;
      default:
        result = { success: true };
    }

    if (!result.success && result.error) {
      const errs: Errors = {};
      for (const issue of result.error.issues) {
        errs[String(issue.path[0])] = issue.message;
      }
      setErrors(errs);
      return false;
    }
    setErrors({});
    return true;
  }

  function next() {
    if (!validateStep()) return;
    if (step < QUOTE_WIZARD_STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      void submit();
    }
  }

  function back() {
    setErrors({});
    setStep((s) => Math.max(0, s - 1));
  }

  async function submit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const utm = readUtm();
      const submitQuote = httpsCallable(functions, 'submitQuoteRequest');
      await submitQuote({
        eventType: data.eventType,
        eventSubtype: data.eventSubtype,
        tentativeDate: data.tentativeDate,
        dateIsFlexible: data.dateIsFlexible,
        guestCount: Number(data.guestCount),
        hasVenue: data.hasVenue ?? false,
        venueName: data.venueName || undefined,
        city: data.city || undefined,
        budgetRange: data.budgetRange,
        services: data.services,
        message: data.message || undefined,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        acceptsContact: data.acceptsContact,
        utm,
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(
        'No pudimos enviar tu solicitud. Verifica tus datos e inténtalo de nuevo.',
      );
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="card text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-protea-50 text-2xl">
          ✨
        </div>
        <h2 className="mt-5 font-serif text-3xl">¡Recibimos tu solicitud!</h2>
        <p className="mx-auto mt-3 max-w-md text-ink/70">
          Gracias, {data.fullName.split(' ')[0]}. Andrea y su equipo revisarán tu
          evento y te contactarán muy pronto con una propuesta personalizada.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Barra de progreso */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs text-ink/60">
          <span>
            Paso {step + 1} de {QUOTE_WIZARD_STEPS.length}
          </span>
          <span>{QUOTE_WIZARD_STEPS[step]!.title}</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-sand">
          <div
            className="h-full rounded-full bg-terracotta transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Paso 0: tipo de evento + ocasión específica */}
      {step === 0 && (
        <StepShell title="¿Qué tipo de evento sueñas?">
          <div className="grid gap-3 sm:grid-cols-3">
            {EVENT_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                // Cambiar de tipo invalida la ocasión elegida del tipo anterior.
                onClick={() =>
                  patch({
                    eventType: t,
                    eventSubtype: data.eventType === t ? data.eventSubtype : undefined,
                  })
                }
                className={`rounded-xl border p-5 text-left transition ${
                  data.eventType === t
                    ? 'border-terracotta bg-terracotta/5'
                    : 'border-sand hover:border-clay'
                }`}
              >
                <span className="font-serif text-lg">{EVENT_TYPE_LABELS[t]}</span>
              </button>
            ))}
          </div>
          <FieldError msg={errors.eventType} />

          {data.eventType && (
            <div className="mt-7">
              <p className="text-sm font-medium">¿Qué ocasión celebrarás?</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {EVENT_SUBTYPES[data.eventType].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => patch({ eventSubtype: s })}
                    className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                      data.eventSubtype === s
                        ? 'border-terracotta bg-terracotta/5'
                        : 'border-sand hover:border-clay'
                    }`}
                  >
                    {EVENT_SUBTYPE_LABELS[s]}
                  </button>
                ))}
              </div>
              <FieldError msg={errors.eventSubtype} />
            </div>
          )}
        </StepShell>
      )}

      {/* Paso 1: fecha e invitados */}
      {step === 1 && (
        <StepShell title="Fecha e invitados">
          <label className="block text-sm font-medium">Fecha tentativa</label>
          <input
            type="date"
            className="input mt-2"
            value={data.tentativeDate ?? ''}
            disabled={data.dateIsFlexible}
            onChange={(e) => patch({ tentativeDate: e.target.value || null })}
          />
          <label className="mt-3 flex items-center gap-2 text-sm text-ink/70">
            <input
              type="checkbox"
              checked={data.dateIsFlexible}
              onChange={(e) =>
                patch({
                  dateIsFlexible: e.target.checked,
                  tentativeDate: e.target.checked ? null : data.tentativeDate,
                })
              }
            />
            Mi fecha aún es flexible
          </label>
          <FieldError msg={errors.tentativeDate} />

          <label className="mt-6 block text-sm font-medium">Número de invitados</label>
          <input
            type="number"
            min={1}
            className="input mt-2"
            placeholder="Ej. 150"
            value={data.guestCount}
            onChange={(e) => patch({ guestCount: e.target.value })}
          />
          <FieldError msg={errors.guestCount} />
        </StepShell>
      )}

      {/* Paso 2: venue y presupuesto */}
      {step === 2 && (
        <StepShell title="Lugar y presupuesto">
          <label className="block text-sm font-medium">¿Ya cuentas con locación?</label>
          <div className="mt-2 flex gap-3">
            {[
              { label: 'Sí, ya tengo venue', value: true },
              { label: 'Aún no', value: false },
            ].map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => patch({ hasVenue: opt.value })}
                className={`flex-1 rounded-xl border p-3 text-sm transition ${
                  data.hasVenue === opt.value
                    ? 'border-terracotta bg-terracotta/5'
                    : 'border-sand hover:border-clay'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {data.hasVenue && (
            <>
              <label className="mt-4 block text-sm font-medium">Nombre del venue</label>
              <input
                className="input mt-2"
                placeholder="Ej. Hacienda San Ángel"
                value={data.venueName}
                onChange={(e) => patch({ venueName: e.target.value })}
              />
              <FieldError msg={errors.venueName} />
            </>
          )}

          <label className="mt-4 block text-sm font-medium">Ciudad</label>
          <input
            className="input mt-2"
            placeholder="Ej. San Miguel de Allende"
            value={data.city}
            onChange={(e) => patch({ city: e.target.value })}
          />

          <label className="mt-6 block text-sm font-medium">Presupuesto estimado</label>
          <div className="mt-2 grid gap-2">
            {BUDGET_RANGES.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => patch({ budgetRange: b })}
                className={`rounded-xl border p-3 text-left text-sm transition ${
                  data.budgetRange === b
                    ? 'border-terracotta bg-terracotta/5'
                    : 'border-sand hover:border-clay'
                }`}
              >
                {BUDGET_RANGE_LABELS[b]}
              </button>
            ))}
          </div>
          <FieldError msg={errors.budgetRange} />
        </StepShell>
      )}

      {/* Paso 3: servicios */}
      {step === 3 && (
        <StepShell title="¿Qué servicios te interesan?">
          <div className="grid gap-2 sm:grid-cols-2">
            {SERVICE_OPTIONS.map((s) => {
              const active = data.services.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() =>
                    patch({
                      services: active
                        ? data.services.filter((x) => x !== s)
                        : [...data.services, s],
                    })
                  }
                  className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm transition ${
                    active ? 'border-terracotta bg-terracotta/5' : 'border-sand hover:border-clay'
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${
                      active ? 'border-terracotta bg-terracotta text-white' : 'border-gold/50'
                    }`}
                  >
                    {active ? '✓' : ''}
                  </span>
                  {SERVICE_LABELS[s]}
                </button>
              );
            })}
          </div>
          <FieldError msg={errors.services} />

          <label className="mt-6 block text-sm font-medium">
            Cuéntanos más sobre tu visión (opcional)
          </label>
          <textarea
            className="input mt-2 min-h-24"
            placeholder="Estilo, inspiración, detalles importantes..."
            value={data.message}
            onChange={(e) => patch({ message: e.target.value })}
          />
        </StepShell>
      )}

      {/* Paso 4: contacto */}
      {step === 4 && (
        <StepShell title="¿A dónde enviamos tu propuesta?">
          <label className="block text-sm font-medium">Nombre completo</label>
          <input
            className="input mt-2"
            value={data.fullName}
            onChange={(e) => patch({ fullName: e.target.value })}
          />
          <FieldError msg={errors.fullName} />

          <label className="mt-4 block text-sm font-medium">Correo electrónico</label>
          <input
            type="email"
            className="input mt-2"
            value={data.email}
            onChange={(e) => patch({ email: e.target.value })}
          />
          <FieldError msg={errors.email} />

          <label className="mt-4 block text-sm font-medium">WhatsApp / Teléfono</label>
          <input
            type="tel"
            className="input mt-2"
            placeholder="Ej. 55 1234 5678"
            value={data.phone}
            onChange={(e) => patch({ phone: e.target.value })}
          />
          <FieldError msg={errors.phone} />

          <label className="mt-5 flex items-start gap-2 text-sm text-ink/70">
            <input
              type="checkbox"
              className="mt-1"
              checked={data.acceptsContact}
              onChange={(e) => patch({ acceptsContact: e.target.checked })}
            />
            Autorizo a Andrea Delgado a contactarme por correo y WhatsApp sobre mi evento.
          </label>
          <FieldError msg={errors.acceptsContact} />
        </StepShell>
      )}

      {submitError && (
        <p className="mt-4 rounded-lg bg-terracotta/10 px-4 py-3 text-sm text-terracotta">
          {submitError}
        </p>
      )}

      {/* Navegación */}
      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={back}
          disabled={step === 0 || submitting}
          className="text-sm text-ink/60 disabled:opacity-30"
        >
          ← Atrás
        </button>
        <button type="button" onClick={next} disabled={submitting} className="btn-primary">
          {submitting
            ? 'Enviando…'
            : step === QUOTE_WIZARD_STEPS.length - 1
              ? 'Enviar solicitud'
              : 'Continuar'}
        </button>
      </div>
    </div>
  );
}

function StepShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-serif text-2xl">{title}</h2>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-2 text-sm text-terracotta">{msg}</p>;
}

/** Lee parámetros UTM de la URL para atribución de marketing. */
function readUtm(): Record<string, string> | undefined {
  if (typeof window === 'undefined') return undefined;
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const k of ['source', 'medium', 'campaign', 'term', 'content']) {
    const v = params.get(`utm_${k}`);
    if (v) utm[k] = v;
  }
  return Object.keys(utm).length ? utm : undefined;
}
