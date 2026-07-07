# PROTEA · Andrea Delgado

Plataforma web de nivel empresarial (ERP/CRM + Gestor de Eventos) para una
Wedding & Event Planner de alto perfil. Sitio público premium, cotizador
inteligente, CRM, módulo avanzado de confirmaciones (RSVP por WhatsApp),
pagos, facturación CFDI 4.0 y motor de IA.

Instagram: [@andreadelgadoplanner](https://www.instagram.com/andreadelgadoplanner/)

## Stack

- **Frontend:** Next.js 15 (App Router) · React 19 · TypeScript estricto · Tailwind CSS
- **Backend:** Firebase Cloud Functions (Gen 2, Node 20) · TypeScript
- **Datos:** Firestore (NoSQL) con reglas de seguridad por rol
- **Auth:** Firebase Auth (Email, Google, Apple) con custom claims de rol
- **Integraciones:** WhatsApp Business Cloud API · Anthropic (Claude) · Stripe · PAC CFDI 4.0
- **CI/CD:** GitHub Actions → Firebase Hosting + Functions

## Estructura del monorepo

```
.
├── apps/
│   └── web/                  # Next.js: sitio público + portales (cliente y planner)
│       └── src/
│           ├── app/          # Rutas: /, /cotizar, /portal, /admin/*
│           ├── components/   # UI: cotizador, RSVP dashboard, auth, layout
│           └── lib/          # Firebase client, contexto de auth
├── functions/                # Cloud Functions (TypeScript)
│   └── src/
│       ├── auth/             # Asignación de roles (custom claims)
│       ├── crm/              # Leads + importación masiva de invitados
│       ├── whatsapp/         # Webhook RSVP + campañas + recordatorios
│       ├── rsvp/             # Agregación de estadísticas en tiempo real
│       ├── finance/          # Pagos (Stripe) + timbrado CFDI 4.0
│       ├── ai/               # Chatbot FAQ + generación de contenido
│       └── lib/              # Admin SDK, WhatsApp client, flujo RSVP, mail
├── packages/
│   └── shared/               # Modelo de datos, enums y esquemas Zod (web + functions)
├── firestore.rules           # Reglas de seguridad por rol
├── firestore.indexes.json    # Índices compuestos
├── storage.rules             # Reglas de Cloud Storage
├── firebase.json             # Hosting + Functions + emuladores
└── .github/workflows/        # CI/CD
```

## Módulos

1. **Sitio público** — Landing, servicios, portafolio y cotizador multi-step.
2. **Cotizador inteligente** (`/cotizar`) — 5 pasos validados con Zod; crea un Lead
   en el CRM y dispara notificaciones a la planner (correo + WhatsApp).
3. **CRM / Pipeline** (`/admin/leads`) — Kanban por etapa con scoring automático.
4. **Módulo de Confirmaciones (RSVP)** (`/admin/confirmaciones`):
   - Importación masiva de invitados (Excel/CSV).
   - Campañas de WhatsApp: Save the date, invitación con botones y recordatorios.
   - Flujo conversacional (asistencia, acompañantes, menú, alergias).
   - Dashboard en tiempo real (gráficas) para planner y clientes.
5. **Portal de clientes** (`/portal`) — progreso del evento y confirmaciones en vivo.
6. **Finanzas** — Cobros con Stripe Checkout + timbrado CFDI 4.0 vía PAC.
7. **Motor de IA** (`/admin/ia`) — copys de Instagram, ideas de diseño, itinerarios.

## Puesta en marcha

```bash
# 1. Instalar dependencias (workspaces)
npm install

# 2. Configurar variables
cp apps/web/.env.local.example apps/web/.env.local   # completar
cp functions/.env.example functions/.env             # completar

# 3. Secretos de Functions
firebase functions:secrets:set WHATSAPP_TOKEN
firebase functions:secrets:set WHATSAPP_APP_SECRET
firebase functions:secrets:set WHATSAPP_VERIFY_TOKEN
firebase functions:secrets:set ANTHROPIC_API_KEY
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
firebase functions:secrets:set PAC_API_KEY

# 4. Desarrollo local
npm run dev            # Next.js en http://localhost:3000
npm run emulators      # Emuladores de Firebase

# 5. Extensión de correo (opcional pero recomendada)
firebase ext:install firebase/firestore-send-email
```

## Configuración del webhook de WhatsApp

1. Desplegar Functions: `npm run deploy:functions`.
2. En Meta for Developers, configurar el webhook apuntando a la URL de
   `whatsappWebhook` con el mismo `WHATSAPP_VERIFY_TOKEN`.
3. Suscribir el campo `messages`.

## Modelo de datos (Firestore)

- `leads` — prospectos del cotizador (pipeline CRM).
- `clients` — expedientes comerciales.
- `events/{id}` — eventos; subcolecciones: `guests`, `tables`, `timeline`,
  `tasks`, `budget`, `payments`.
- `invoices` — facturas CFDI 4.0 (solo backend).
- `vendors`, `faq`, `settings`.
- `waConversations`, `waMessages` — estado del flujo de WhatsApp (solo backend).

Las reglas de seguridad (`firestore.rules`) aplican control por rol
(`planner` / `staff` / `client`), con acceso de clientes acotado a sus propios
eventos vía `memberUids`.

## Despliegue

Push a `main` dispara el workflow de GitHub Actions que valida (typecheck +
build) y despliega Hosting, Functions y reglas. Requiere el secreto de repo
`FIREBASE_SERVICE_ACCOUNT` (JSON de una service account con permisos de deploy).
