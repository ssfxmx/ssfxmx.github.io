/**
 * Prerenderizado de metaetiquetas y generación del sitemap.
 *
 * EL PROBLEMA
 * Una SPA de React entrega un HTML vacío: el contenido lo pinta JavaScript.
 * Google a veces lo ejecuta, pero WhatsApp, Discord, Twitter y Facebook NO.
 * Al compartir una noticia se vería una tarjeta sin título ni imagen. Para una
 * comunidad que crece por enlaces compartidos, eso es un problema de
 * crecimiento, no cosmético.
 *
 * LA SOLUCIÓN
 * Tras compilar, este script consulta Supabase, y para cada noticia, evento,
 * tutorial y jugador escribe un index.html propio con sus metaetiquetas Open
 * Graph ya resueltas. El visitante real sigue recibiendo la SPA completa (el
 * bundle es el mismo); el robot que solo lee HTML encuentra título, descripción
 * e imagen correctos.
 *
 * POR QUÉ NO SE USÓ UNA LIBRERÍA DE SSG
 * Las opciones tipo vite-react-ssg obligan a reestructurar el router y añaden
 * una dependencia pesada para resolver un problema que aquí se reduce a
 * sustituir cadenas en un HTML. Menos dependencias, menos cosas que se rompen
 * en tres años.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SITE_URL = (process.env.VITE_SITE_URL || 'https://ssfxmx.github.io').replace(/\/$/, '');
const DIST = resolve('dist');

// Si faltan credenciales no se aborta el build: se publica el sitio sin
// prerenderizado. Es preferible un sitio en línea con metaetiquetas genéricas
// a un despliegue fallido.
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('[prerender] Sin credenciales de Supabase. Se omite el prerenderizado.');
  process.exit(0);
}

const template = readFileSync(resolve(DIST, 'index.html'), 'utf-8');

/** Consulta la API REST de Supabase respetando las políticas RLS públicas. */
async function query(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) {
    console.warn(`[prerender] Error consultando ${path}: ${res.status}`);
    return [];
  }
  return res.json();
}

/** Escapa el texto que se inyecta en atributos HTML. */
function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function storageUrl(bucket, path) {
  if (!path) return `${SITE_URL}/og-default.png`;
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

/** Escribe dist/<ruta>/index.html con las metaetiquetas sustituidas. */
function writePage(route, { title, description, image, type = 'article' }) {
  const fullTitle = `${title} — SSF2X México`;
  const url = `${SITE_URL}${route}`;

  const html = template
    .replace(
      /<title>.*?<\/title>/s,
      `<title>${esc(fullTitle)}</title>`
    )
    .replace(
      /<meta name="description"[^>]*>/,
      `<meta name="description" content="${esc(description)}" />`
    )
    .replace(
      /<meta property="og:type"[^>]*>/,
      `<meta property="og:type" content="${type}" />`
    )
    .replace(
      /<meta property="og:title"[^>]*>/,
      `<meta property="og:title" content="${esc(fullTitle)}" />\n    <meta property="og:url" content="${esc(url)}" />\n    <meta property="og:image" content="${esc(image)}" />\n    <link rel="canonical" href="${esc(url)}" />`
    )
    .replace(
      /<meta property="og:description"[^>]*>/,
      `<meta property="og:description" content="${esc(description)}" />`
    );

  const target = resolve(DIST, `.${route}`, 'index.html');
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, html, 'utf-8');
  return url;
}

function trim(text, max = 180) {
  const clean = String(text ?? '').replace(/[#*_`>\[\]]/g, '').replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

const urls = [];

// --- Rutas estáticas ---------------------------------------------------------
const STATIC_ROUTES = [
  ['/', 'Inicio', 'Torneos mensuales, resultados y comunidad de Super Street Fighter II X en México.', 'website'],
  ['/noticias', 'Noticias', 'Todas las noticias de la comunidad SSF2X México.', 'website'],
  ['/eventos', 'Eventos', 'Próximos torneos y eventos de la comunidad.', 'website'],
  ['/resultados', 'Resultados', 'Historial completo de torneos y podios.', 'website'],
  ['/jugadores', 'Jugadores', 'Directorio de jugadores de la comunidad.', 'website'],
  ['/tutoriales', 'Tutoriales', 'Guías para empezar a jugar y mejorar.', 'website'],
];

for (const [route, title, description, type] of STATIC_ROUTES) {
  urls.push({
    loc: writePage(route, { title, description, image: `${SITE_URL}/og-default.png`, type }),
    priority: route === '/' ? '1.0' : '0.8',
  });
}

// --- Contenido dinámico ------------------------------------------------------
try {
  const news = await query('news?select=slug,title,excerpt,cover_path,published_at&status=eq.published&order=published_at.desc&limit=500');
  for (const item of news) {
    urls.push({
      loc: writePage(`/noticias/${item.slug}`, {
        title: item.title,
        description: trim(item.excerpt || item.title),
        image: storageUrl('media', item.cover_path),
      }),
      lastmod: item.published_at,
      priority: '0.7',
    });
  }

  const events = await query('events?select=slug,name,description_md,cover_path,starts_at&status=neq.draft&order=starts_at.desc&limit=500');
  for (const item of events) {
    urls.push({
      loc: writePage(`/eventos/${item.slug}`, {
        title: item.name,
        description: trim(item.description_md || item.name),
        image: storageUrl('media', item.cover_path),
      }),
      lastmod: item.starts_at,
      priority: '0.7',
    });
  }

  const tutorials = await query('tutorials?select=slug,title,summary,cover_path&status=eq.published&limit=500');
  for (const item of tutorials) {
    urls.push({
      loc: writePage(`/tutoriales/${item.slug}`, {
        title: item.title,
        description: trim(item.summary || item.title),
        image: storageUrl('media', item.cover_path),
      }),
      priority: '0.6',
    });
  }

  const players = await query('players_public?select=nickname,city,character_name&limit=1000');
  for (const item of players) {
    const where = item.city ? ` de ${item.city}` : '';
    const main = item.character_name ? ` Main: ${item.character_name}.` : '';
    urls.push({
      loc: writePage(`/jugadores/${item.nickname}`, {
        title: item.nickname,
        description: trim(`Perfil de ${item.nickname}${where} en la comunidad SSF2X México.${main}`),
        image: `${SITE_URL}/og-default.png`,
        type: 'profile',
      }),
      priority: '0.5',
    });
  }

  console.log(`[prerender] ${urls.length} rutas generadas.`);
} catch (error) {
  console.warn('[prerender] Falló la consulta de contenido:', error.message);
}

// --- sitemap.xml y robots.txt ------------------------------------------------
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${String(u.lastmod).slice(0, 10)}</lastmod>` : ''}<priority>${u.priority}</priority></url>`
  )
  .join('\n')}
</urlset>
`;
writeFileSync(resolve(DIST, 'sitemap.xml'), sitemap, 'utf-8');

if (!existsSync(resolve(DIST, 'robots.txt'))) {
  writeFileSync(
    resolve(DIST, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
    'utf-8'
  );
}

console.log('[prerender] sitemap.xml escrito.');
