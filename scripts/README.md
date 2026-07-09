# Scripts operativos — PROTEA · Andrea Delgado

## Publicar el portafolio SIN terminal (recomendado) 📸

No necesitas correr nada en tu máquina. El flujo automático
`.github/workflows/portfolio.yml` hace todo:

1. **Sube tu `.zip` de fotos una sola vez a Firebase Storage.**
   - Abre la [consola de Firebase → Storage](https://console.firebase.google.com/project/protea-andrea-delgado/storage).
   - Crea (o entra a) la carpeta `uploads/`.
   - Arrastra tu zip y nómbralo `portfolio-raw.zip` (o recuerda el nombre que le pongas).
2. **Ejecuta el flujo.**
   - Ve a GitHub → pestaña **Actions** → **“Portafolio · Procesar fotos”** → **Run workflow**.
   - Deja `uploads/portfolio-raw.zip` (o escribe tu nombre de archivo) y ejecuta.
3. **Listo.** En unos minutos el flujo descarga el zip, optimiza cada foto
   (máx. 1920px, WebP q80), la escribe en `apps/web/public/portfolio/`,
   actualiza `apps/web/src/data/portfolio-urls.json`, commitea a `main` y
   publica en Vercel (si el secreto `VERCEL_TOKEN` está configurado).

### Categorización (opcional)

Dentro del zip, organiza las fotos en carpetas llamadas `Bodas/`, `Sociales/`
(o `Fiesta/`, `XV/`) y `Corporativos/` (o `Empresa/`) para que el sitio las
divida en esas tres secciones. Lo que no esté en una carpeta reconocida cae en
**Bodas**; puedes recategorizar después editando el campo `category` en
`apps/web/src/data/portfolio-urls.json`.

---

## Variantes manuales (por si alguna vez las necesitas)

Utilidades que se corren **manualmente en tu máquina** (no forman parte del
build de la app ni del CI). Requieren Node.js 18+ y haber clonado este repo.

### `process-portfolio.mjs` — optimizar a archivos locales del repo

La misma optimización que usa el flujo automático: escribe los `.webp` en
`apps/web/public/portfolio/<categoría>/` y regenera el JSON con rutas locales.
No necesita credenciales.

```bash
cd scripts
npm install
node process-portfolio.mjs --zip "C:\ruta\a\mis-fotos.zip" --clean
```

Después: commit de `apps/web/public/portfolio` + el JSON, push y deploy.

### `upload-portfolio.mjs` — subir a Firebase Storage (lectura pública)

Variante que sube los `.webp` al bucket `protea-andrea-delgado.firebasestorage.app`
bajo `portfolio/` con `makePublic()`, y escribe el JSON con URLs
`https://storage.googleapis.com/...`. Requiere la **clave de cuenta de
servicio** (`.json`) con acceso a Storage.

```bash
cd scripts
npm install
node upload-portfolio.mjs \
  --zip "C:\ruta\a\mis-fotos.zip" \
  --key "C:\ruta\a\protea-andrea-delgado-XXXX.json"
```

Después: commit de `apps/web/src/data/portfolio-urls.json`, push y deploy.
