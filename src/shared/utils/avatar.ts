/**
 * Avatares.
 *
 * DECISIÓN LEGAL (§9.1 del documento de arquitectura)
 *
 * El requisito original pedía usar el personaje principal como avatar, pero
 * también prohibía material con copyright. Una imagen del personaje ES material
 * con copyright: los dos requisitos eran incompatibles.
 *
 * Solución: el avatar por personaje se DIBUJA POR CÓDIGO como un monograma —
 * las iniciales del personaje sobre su color de identidad, con un biselado que
 * recuerda a los paneles de gabinete. Cero archivos, cero riesgo legal, y
 * encaja con la estética del sitio.
 *
 * Si algún día se encarga arte original propio, basta con llenar
 * characters.icon_path: el esquema ya lo contempla y esto sigue funcionando
 * como respaldo.
 */

import { storagePublicUrl } from '@/shared/lib/supabase';

interface AvatarInput {
  avatar_source?: string | null;
  avatar_path?: string | null;
  nickname?: string | null;
  character_initials?: string | null;
  character_color?: string | null;
  /** Icono del personaje subido desde el panel, si existe. */
  character_icon_path?: string | null;
}

/** Color estable derivado del texto, para quien no tiene personaje asignado. */
function fallbackColor(seed: string): string {
  const palette = [
    '#FFB000', '#00E5FF', '#FF2E88', '#3DDC84',
    '#A855F7', '#F97316', '#3B82F6', '#EAB308',
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return palette[hash % palette.length] as string;
}

/** Aclara u oscurece un color hexadecimal. amount > 0 aclara. */
function shade(hex: string, amount: number): string {
  const clean = hex.replace('#', '');
  const num = parseInt(clean.length === 3 ? clean.repeat(2) : clean, 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(((num >> 16) & 255) + amount);
  const g = clamp(((num >> 8) & 255) + amount);
  const b = clamp((num & 255) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Genera el avatar de monograma como data URI de SVG.
 * Se genera en el cliente: no consume Storage ni ancho de banda.
 */
export function monogramDataUri(initials: string, color: string): string {
  const text = (initials || '??').slice(0, 2).toUpperCase();
  const dark = shade(color, -90);
  const light = shade(color, 40);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${dark}"/>
</linearGradient></defs>
<path d="M0 0 H108 L128 20 V128 H20 L0 108 Z" fill="url(#g)"/>
<path d="M0 0 H108 L128 20 V128 H20 L0 108 Z" fill="none" stroke="${color}" stroke-width="4"/>
<text x="64" y="64" font-family="'Press Start 2P',monospace" font-size="34"
  fill="#0B0B12" text-anchor="middle" dominant-baseline="central">${text}</text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Resuelve la imagen de avatar de un jugador.
 *
 * Orden de preferencia:
 *   1. Imagen subida por el propio usuario
 *   2. Icono del personaje, si el administrador subió uno
 *   3. Monograma generado por código
 *
 * Los tres conviven a propósito. Si un personaje no tiene icono, su avatar
 * sigue funcionando; y si algún día hay que retirar los iconos, basta con
 * vaciar la columna: el monograma vuelve a cubrir el hueco sin tocar código ni
 * dejar avatares rotos.
 */
export function resolveAvatar(input: AvatarInput): string {
  if (input.avatar_source === 'upload' && input.avatar_path) {
    const url = storagePublicUrl('avatars', input.avatar_path);
    if (url) return url;
  }

  if (input.character_icon_path) {
    const url = storagePublicUrl('media', input.character_icon_path);
    if (url) return url;
  }

  const nickname = input.nickname ?? '??';

  if (input.character_initials && input.character_color) {
    return monogramDataUri(input.character_initials, input.character_color);
  }

  return monogramDataUri(nickname.slice(0, 2), fallbackColor(nickname));
}

/**
 * Redimensiona y convierte a WebP antes de subir.
 *
 * Se hace en el navegador para que el bucket no se llene de fotos de 4 MB. El
 * límite de 512 KB también está declarado en el servidor (0009_storage.sql):
 * la validación del cliente se puede saltar, la del servidor no.
 */
export async function prepareAvatarFile(file: File, size = 256): Promise<Blob> {
  const bitmap = await createImageBitmap(file);

  // Recorte cuadrado centrado: evita avatares deformados.
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo procesar la imagen en este navegador.');

  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo convertir la imagen.'))),
      'image/webp',
      0.85
    );
  });
}
