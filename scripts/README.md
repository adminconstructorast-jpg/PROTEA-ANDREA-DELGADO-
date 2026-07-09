# Scripts operativos — PROTEA · Andrea Delgado

Utilidades que se corren **manualmente en tu máquina** (no forman parte del build
de la app ni del CI).

## `upload-portfolio.mjs` — subir el portafolio a Firebase Storage

Descomprime un `.zip` de fotos, las optimiza (máx. **1920px** de ancho, **WebP q80**)
y las sube al bucket de producción `protea-andrea-delgado.firebasestorage.app`
bajo `portfolio/` como **lectura pública**. Al terminar escribe
`apps/web/src/data/portfolio-urls.json` (que ya consume el landing) y limpia la
carpeta temporal.

### Requisitos

- Node.js 18 o superior.
- La **clave de cuenta de servicio** de Google Cloud (el `.json` que descargaste
  de la consola, p. ej. `protea-andrea-delgado-XXXX.json`). Es la misma cuenta
  con permisos de Storage que ya usa el despliegue.

### Pasos

```bash
cd scripts
npm install

node upload-portfolio.mjs \
  --zip "C:\Users\SERGIO TOSCANO\Downloads\drive-download-XXXX.zip" \
  --key "C:\ruta\a\protea-andrea-delgado-XXXX.json"
```

En Windows PowerShell, usa comillas alrededor de las rutas con espacios (como
arriba). Si prefieres, en vez de `--key` puedes exportar la variable
`GOOGLE_APPLICATION_CREDENTIALS` apuntando al `.json`.

### Categorización (opcional)

Si dentro del `.zip` organizas las fotos en carpetas llamadas `Bodas/`,
`Sociales/` (o `Fiesta/`, `XV/`) y `Corporativos/` (o `Empresa/`), el script las
clasifica automáticamente en esas tres secciones del sitio. Las fotos que no
estén en una carpeta reconocida se asignan a **Bodas** por defecto; puedes
recategorizarlas después editando el campo `category` en
`apps/web/src/data/portfolio-urls.json`.

### Después de correrlo

```bash
git add apps/web/src/data/portfolio-urls.json
git commit -m "chore: portafolio real subido a Storage"
git push
```

El push dispara el auto-deploy en Vercel y el landing muestra las fotos reales.
