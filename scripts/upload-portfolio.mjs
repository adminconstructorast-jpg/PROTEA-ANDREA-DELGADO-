#!/usr/bin/env node
/**
 * PROTEA · Andrea Delgado — Pipeline de portafolio.
 *
 * Descomprime un .zip de fotos, las optimiza (máx. 1920px de ancho, WebP q80) y
 * las sube al bucket de producción de Firebase Storage como lectura pública.
 * Al terminar escribe `apps/web/src/data/portfolio-urls.json` con las URLs
 * públicas y limpia la carpeta temporal.
 *
 * ── Requisitos ────────────────────────────────────────────────────────────────
 *   • Node.js 18+ instalado.
 *   • Una clave de cuenta de servicio de Google Cloud con acceso a Storage
 *     (el JSON que descargaste de la consola, p. ej.
 *     protea-andrea-delgado-XXXX.json).
 *
 * ── Uso ───────────────────────────────────────────────────────────────────────
 *   1) Colócate en la carpeta `scripts/` del repo e instala dependencias:
 *        cd scripts
 *        npm install
 *   2) Ejecuta, apuntando a tu .zip y a tu clave de servicio:
 *        node upload-portfolio.mjs \
 *          --zip "C:\\Users\\SERGIO TOSCANO\\Downloads\\drive-download-XXXX.zip" \
 *          --key "C:\\ruta\\a\\protea-andrea-delgado-XXXX.json"
 *
 *   Categorización opcional: si dentro del .zip organizas las fotos en carpetas
 *   llamadas "Bodas", "Sociales" (o "Fiesta"/"XV") y "Corporativos" (o "Empresa"),
 *   el script las clasifica solo. Las que no estén en una carpeta reconocida se
 *   asignan a "bodas" (puedes recategorizarlas luego editando el JSON).
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
const { Storage } = require('@google-cloud/storage');

// ── Config ────────────────────────────────────────────────────────────────────
const BUCKET = 'protea-andrea-delgado.firebasestorage.app';
const DEST_PREFIX = 'portfolio';
const MAX_WIDTH = 1920;
const WEBP_QUALITY = 80;
const OUTPUT_JSON = path.resolve(__dirname, '../apps/web/src/data/portfolio-urls.json');

// ── Argumentos ────────────────────────────────────────────────────────────────
function getArg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : undefined;
}
const ZIP_PATH = getArg('zip');
const KEY_PATH = getArg('key') || process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!ZIP_PATH) {
  console.error('✗ Falta --zip <ruta al .zip>');
  process.exit(1);
}
if (!KEY_PATH) {
  console.error('✗ Falta --key <cuenta de servicio .json> (o define GOOGLE_APPLICATION_CREDENTIALS)');
  process.exit(1);
}
if (!fs.existsSync(ZIP_PATH)) {
  console.error(`✗ No existe el zip: ${ZIP_PATH}`);
  process.exit(1);
}
if (!fs.existsSync(KEY_PATH)) {
  console.error(`✗ No existe la clave de servicio: ${KEY_PATH}`);
  process.exit(1);
}

// ── Utilidades ────────────────────────────────────────────────────────────────
const IMG_RE = /\.(jpe?g|png|tiff?|heic|webp)$/i;

function categorize(relPath) {
  const p = relPath.toLowerCase();
  if (/(^|\/)(boda|bodas|wedding)/.test(p)) return 'bodas';
  if (/(^|\/)(social|sociales|fiesta|xv|xv-a|cumple|despedida)/.test(p)) return 'sociales';
  if (/(^|\/)(corp|corporativo|corporativos|empresa|empresarial)/.test(p)) return 'corporativos';
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
  return base
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

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

    if (files.length === 0) {
      throw new Error('No se encontraron imágenes en el zip.');
    }
    console.log(`▸ ${files.length} imágenes encontradas.`);

    // 3) Storage.
    const storage = new Storage({ keyFilename: KEY_PATH });
    const bucket = storage.bucket(BUCKET);

    const images = [];
    let i = 0;
    for (const file of files) {
      i += 1;
      const rel = path.relative(tmpDir, file).split(path.sep).join('/');
      const category = categorize(rel);
      const base = slugify(path.basename(file, path.extname(file))) || `foto-${i}`;
      const objectName = `${DEST_PREFIX}/${category}/${base}-${i}.webp`;

      // Optimizar: máx. 1920px de ancho (sin escalar hacia arriba), WebP q80.
      const buffer = await sharp(file)
        .rotate() // respeta EXIF
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();

      const gcsFile = bucket.file(objectName);
      await gcsFile.save(buffer, {
        resumable: false,
        contentType: 'image/webp',
        metadata: { cacheControl: 'public, max-age=31536000, immutable' },
      });
      await gcsFile.makePublic(); // lectura pública

      const url = `https://storage.googleapis.com/${BUCKET}/${objectName}`;
      images.push({ src: url, category, alt: humanTitle(base) });
      process.stdout.write(`\r  Subiendo ${i}/${files.length} → ${category}   `);
    }
    process.stdout.write('\n');

    // 4) Escribir el JSON de datos.
    const hero = images[0]?.src ?? '';
    const payload = {
      generatedAt: new Date().toISOString(),
      bucket: BUCKET,
      hero,
      images,
    };
    await fsp.mkdir(path.dirname(OUTPUT_JSON), { recursive: true });
    await fsp.writeFile(OUTPUT_JSON, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    console.log(`▸ Escrito ${path.relative(path.resolve(__dirname, '..'), OUTPUT_JSON)} (${images.length} URLs).`);

    const byCat = images.reduce((acc, im) => ((acc[im.category] = (acc[im.category] || 0) + 1), acc), {});
    console.log(`▸ Por categoría: ${JSON.stringify(byCat)}`);
    console.log('✓ Listo. Haz commit del JSON y el próximo deploy mostrará las fotos.');
  } finally {
    // 5) Limpiar temporal.
    await fsp.rm(tmpDir, { recursive: true, force: true });
    console.log(`▸ Carpeta temporal eliminada.`);
  }
}

main().catch((err) => {
  console.error('\n✗ Error:', err.message || err);
  process.exit(1);
});
