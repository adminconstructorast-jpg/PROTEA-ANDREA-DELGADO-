#!/usr/bin/env node
/**
 * PROTEA · Andrea Delgado — Procesado de portafolio (variante para CI).
 *
 * A diferencia de `upload-portfolio.mjs` (que sube a Firebase Storage y necesita
 * una cuenta de servicio), este script:
 *   • recibe un .zip local ya descargado,
 *   • optimiza cada foto (máx. 1920px de ancho, WebP q80),
 *   • las ESCRIBE como archivos estáticos en `apps/web/public/portfolio/<cat>/`,
 *   • y regenera `apps/web/src/data/portfolio-urls.json` con RUTAS LOCALES
 *     (`/portfolio/<cat>/<archivo>.webp`) que Vercel sirve por CDN.
 *
 * Así el portafolio no depende de permisos públicos de Storage ni de tokens de
 * descarga: son assets versionados en el repo. Pensado para correr en el
 * workflow `.github/workflows/portfolio.yml`, aunque también funciona local.
 *
 * ── Uso ───────────────────────────────────────────────────────────────────────
 *     cd scripts && npm install
 *     node process-portfolio.mjs --zip ../mis-fotos.zip [--clean]
 *
 *   Categorización: si dentro del .zip organizas las fotos en carpetas llamadas
 *   "Bodas", "Sociales" (o "Fiesta"/"XV") y "Corporativos" (o "Empresa"), el
 *   script las clasifica solo. Las que no estén en una carpeta reconocida se
 *   asignan a "bodas".
 *
 *   --clean  Borra el contenido previo de public/portfolio/{bodas,sociales,
 *            corporativos} antes de escribir (evita acumular fotos de corridas
 *            anteriores). Sin la bandera, se conservan y se agregan las nuevas.
 */

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Dependencias (ver scripts/package.json).
const AdmZip = require('adm-zip');
const sharp = require('sharp');

// ── Config ────────────────────────────────────────────────────────────────────
const MAX_WIDTH = 1920;
const WEBP_QUALITY = 80;
const CATEGORIES = ['bodas', 'sociales', 'corporativos'];
const REPO_ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(REPO_ROOT, 'apps/web/public/portfolio');
const OUTPUT_JSON = path.join(REPO_ROOT, 'apps/web/src/data/portfolio-urls.json');
const BUCKET = 'protea-andrea-delgado.firebasestorage.app';

// ── Argumentos ────────────────────────────────────────────────────────────────
function getArg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : undefined;
}
const hasFlag = (name) => process.argv.includes(`--${name}`);

const ZIP_PATH = getArg('zip');
const CLEAN = hasFlag('clean');

if (!ZIP_PATH) {
  console.error('✗ Falta --zip <ruta al .zip>');
  process.exit(1);
}
if (!fs.existsSync(ZIP_PATH)) {
  console.error(`✗ No existe el zip: ${ZIP_PATH}`);
  process.exit(1);
}

// ── Utilidades ────────────────────────────────────────────────────────────────
const IMG_RE = /\.(jpe?g|png|tiff?|heic|heif|webp|avif)$/i;

function categorize(relPath) {
  const p = relPath.toLowerCase();
  if (/(^|\/)(social|sociales|fiesta|xv|cumple|despedida|aniversario)/.test(p)) return 'sociales';
  if (/(^|\/)(corp|corporativo|corporativos|empresa|empresarial|marca|gala)/.test(p)) return 'corporativos';
  if (/(^|\/)(boda|bodas|wedding|novi)/.test(p)) return 'bodas';
  return 'bodas'; // por defecto (planner principalmente de bodas)
}

function slugify(str) {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function humanTitle(base) {
  const cleaned = base
    .replace(/[-_]+/g, ' ')
    .replace(/\b(img|dsc|foto|image)\b/gi, '')
    .replace(/\d{3,}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned ? cleaned.replace(/\b\w/g, (c) => c.toUpperCase()) : 'Evento diseñado por Andrea Delgado';
}

const ALT_BY_CATEGORY = {
  bodas: 'Boda diseñada por Andrea Delgado',
  sociales: 'Evento social diseñado por Andrea Delgado',
  corporativos: 'Evento corporativo diseñado por Andrea Delgado',
};

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'protea-portfolio-'));
  console.log(`▸ Carpeta temporal: ${tmpDir}`);

  try {
    // 1) Descomprimir.
    console.log(`▸ Descomprimiendo ${path.basename(ZIP_PATH)}…`);
    new AdmZip(ZIP_PATH).extractAllTo(tmpDir, true);

    // 2) Reunir imágenes (recursivo).
    const files = [];
    (function walk(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.') || entry.name === '__MACOSX') continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (IMG_RE.test(entry.name)) files.push(full);
      }
    })(tmpDir);

    if (files.length === 0) throw new Error('No se encontraron imágenes en el zip.');
    files.sort();
    console.log(`▸ ${files.length} imágenes encontradas.`);

    // 3) Preparar carpetas de salida.
    if (CLEAN) {
      for (const cat of CATEGORIES) {
        await fsp.rm(path.join(PUBLIC_DIR, cat), { recursive: true, force: true });
      }
      console.log('▸ Limpieza: carpetas de categoría previas eliminadas.');
    }
    for (const cat of CATEGORIES) {
      await fsp.mkdir(path.join(PUBLIC_DIR, cat), { recursive: true });
    }

    // 4) Optimizar + escribir cada imagen.
    const images = [];
    const skipped = [];
    let i = 0;
    for (const file of files) {
      i += 1;
      const rel = path.relative(tmpDir, file).split(path.sep).join('/');
      const category = categorize(rel);
      const base = slugify(path.basename(file, path.extname(file))) || `foto-${i}`;
      const fileName = `${base}-${String(i).padStart(3, '0')}.webp`;
      const outPath = path.join(PUBLIC_DIR, category, fileName);

      try {
        await sharp(file)
          .rotate() // respeta EXIF
          .resize({ width: MAX_WIDTH, withoutEnlargement: true })
          .webp({ quality: WEBP_QUALITY })
          .toFile(outPath);
      } catch (err) {
        skipped.push({ file: rel, reason: err.message || String(err) });
        process.stdout.write(`\r  ⚠ omitida ${i}/${files.length} (${path.basename(rel)})            `);
        continue;
      }

      images.push({
        src: `/portfolio/${category}/${fileName}`,
        category,
        alt: `${humanTitle(base)} — ${ALT_BY_CATEGORY[category]}`.replace(/^ — /, ''),
      });
      process.stdout.write(`\r  Optimizando ${i}/${files.length} → ${category}        `);
    }
    process.stdout.write('\n');

    if (images.length === 0) throw new Error('Ninguna imagen se pudo optimizar.');

    // 5) Escribir el JSON de datos (rutas locales servidas por Vercel).
    const hero = images[0].src;
    const payload = { generatedAt: new Date().toISOString(), bucket: BUCKET, hero, images };
    await fsp.mkdir(path.dirname(OUTPUT_JSON), { recursive: true });
    await fsp.writeFile(OUTPUT_JSON, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

    const byCat = images.reduce((acc, im) => ((acc[im.category] = (acc[im.category] || 0) + 1), acc), {});
    console.log(`▸ Escrito ${path.relative(REPO_ROOT, OUTPUT_JSON)} (${images.length} imágenes).`);
    console.log(`▸ Por categoría: ${JSON.stringify(byCat)}`);
    if (skipped.length) {
      console.log(`▸ Omitidas ${skipped.length}: ${skipped.map((s) => s.file).join(', ')}`);
    }
    console.log('✓ Listo. Haz commit de public/portfolio y del JSON, y despliega a Vercel.');
  } finally {
    await fsp.rm(tmpDir, { recursive: true, force: true });
    console.log('▸ Carpeta temporal eliminada.');
  }
}

main().catch((err) => {
  console.error('\n✗ Error:', err.message || err);
  process.exit(1);
});
