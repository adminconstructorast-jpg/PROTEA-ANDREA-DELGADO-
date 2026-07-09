# PROTEA · Puesta en marcha — checklist guiada ✅

El sitio público y todo el código ya están **desplegados y funcionando**:

- 🌐 Sitio: https://protea-andrea-delgado.vercel.app (Vercel, auto-publicable)
- ⚙️ Backend: 14 Cloud Functions activas en el proyecto Firebase `protea-andrea-delgado`
- 🔐 CI/CD: GitHub Actions despliega funciones y reglas en cada push a `main`

Lo que sigue son **activaciones que dependen de cuentas y credenciales del
negocio** (no de código). Cada credencial se guarda como *Secret* del repo en
GitHub: **Settings → Secrets and variables → Actions → New repository secret**.
Tras guardar secretos nuevos, corre el workflow **Deploy · PROTEA** (pestaña
Actions → Run workflow) para que lleguen a las funciones.

---

## 0. Fotos del portafolio (sin credenciales — hazlo ya) 📸

1. Sube tu `.zip` de fotos a Firebase Storage → carpeta `uploads/` →
   nómbralo `portfolio-raw.zip`
   ([consola](https://console.firebase.google.com/project/protea-andrea-delgado/storage)).
2. GitHub → Actions → **Portafolio · Procesar fotos** → Run workflow.
3. En minutos, el sitio muestra las ~100 fotos optimizadas.

*Detalle completo en `scripts/README.md`. Para que el paso final publique solo,
agrega el secreto `VERCEL_TOKEN` (créalo en vercel.com → Settings → Tokens).*

## 1. Acceso de Andrea al panel (`/admin`) — 2 minutos 🔑

| Secreto | Valor |
|---|---|
| `PLANNER_ADMIN_EMAILS` | correos de Andrea/staff separados por coma, p. ej. `andrea@proteaeventos.mx` |
| `PLANNER_EMAIL` | correo donde recibirá avisos de nuevos leads |

Además, en la [consola de Firebase → Authentication → Sign-in method](https://console.firebase.google.com/project/protea-andrea-delgado/authentication/providers)
habilita **Google** y **Correo/contraseña** (Apple es opcional y requiere
cuenta de Apple Developer).

> Con esto, cuando Andrea inicie sesión su cuenta recibirá el rol `planner`
> automáticamente y verá el panel completo.

## 2. Notificaciones por correo de nuevos leads 📧

Instala la extensión oficial **Trigger Email** (`firebase/firestore-send-email`)
desde la [consola de Firebase → Extensions](https://console.firebase.google.com/project/protea-andrea-delgado/extensions),
apuntando a la colección `mail` y con el SMTP que uses (Gmail/Workspace, etc.).
Sin ella, los leads igual se registran en el CRM; solo no llega el correo.

## 3. WhatsApp Business (RSVP + avisos) 💬

Requiere una cuenta en [Meta for Developers](https://developers.facebook.com/)
con WhatsApp Business API (número verificado y plantillas aprobadas).

| Secreto | Dónde sale |
|---|---|
| `WHATSAPP_TOKEN` | token permanente del sistema (Business Settings → System users) |
| `WHATSAPP_APP_SECRET` | App → Settings → Basic |
| `WHATSAPP_VERIFY_TOKEN` | cadena que tú inventas (la misma que pongas en Meta) |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp → API Setup |
| `PLANNER_PHONE` | celular de Andrea con lada, p. ej. `521XXXXXXXXXX` |

Luego en Meta registra el webhook:
`https://us-central1-protea-andrea-delgado.cloudfunctions.net/whatsappWebhook`
usando tu `WHATSAPP_VERIFY_TOKEN`, y suscríbete al evento `messages`.

## 4. Pagos con Stripe 💳

Con la cuenta de [Stripe](https://dashboard.stripe.com/) del negocio:

| Secreto | Dónde sale |
|---|---|
| `STRIPE_SECRET_KEY` | Developers → API keys (`sk_live_…`) |
| `STRIPE_WEBHOOK_SECRET` | Developers → Webhooks → endpoint `https://us-central1-protea-andrea-delgado.cloudfunctions.net/stripeWebhook` (`whsec_…`) |

## 5. Asistente IA (chat del sitio + estudio de contenido) 🤖

| Secreto | Dónde sale |
|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com/) → API keys |

El chat ya está integrado en el sitio; mientras no haya key responde con una
invitación al cotizador. Con la key, contesta con el FAQ del negocio
(colección `faq` en Firestore: documentos con campos `question` y `answer`).

## 6. Facturación CFDI (México) 🧾

Con un PAC (el código ya habla con **Facturama**):

| Secreto | Valor |
|---|---|
| `PAC_API_KEY` | credencial del PAC |
| `PAC_BASE_URL` | `https://api.facturama.mx` (producción; hoy apunta a sandbox) |
| `CFDI_ISSUER_RFC` / `CFDI_ISSUER_NAME` | RFC y razón social del negocio |
| `CFDI_ISSUER_TAX_REGIME` | régimen fiscal (default `612`) |
| `CFDI_EXPEDITION_ZIP` | C.P. de expedición |

## 7. Dominio propio (cuando quieras) 🌐

En Vercel → proyecto `protea-andrea-delgado` → Settings → Domains → Add.
Vercel te da los registros DNS (A/CNAME) para tu registrador. Sin esto, el
sitio sigue perfecto en `protea-andrea-delgado.vercel.app`.

---

### Orden sugerido

1. **Hoy:** fotos (0) + acceso de Andrea (1) → el sitio queda completo de cara al público.
2. **Esta semana:** correo (2) y WhatsApp (3) → el CRM avisa solo.
3. **Cuando cierren ventas:** Stripe (4) y CFDI (6).
4. **En cualquier momento:** IA (5) y dominio (7).
