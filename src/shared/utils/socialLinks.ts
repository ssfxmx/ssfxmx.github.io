/**
 * Detección de enlaces de video en redes sociales.
 *
 * DECISIÓN: solo se incrustan YouTube y Twitch.
 *
 * X, Facebook, Instagram y TikTok exigen cargar sus propios scripts para
 * mostrar el contenido incrustado. Eso significa tres cosas malas:
 *   1. Rastreadores de terceros en cada visita, incluso de quien solo pasaba
 *      por la portada.
 *   2. La página se rompe cada vez que ellos cambian algo, y no hay aviso.
 *   3. Peso extra que paga todo el mundo, también quien entra desde el celular
 *      con datos.
 *
 * Para esas plataformas se muestra una tarjeta con el título y un enlace que
 * abre la publicación original. Se pierde la reproducción dentro del sitio,
 * pero se gana un sitio que no depende de scripts ajenos para funcionar.
 *
 * YouTube y Twitch se incrustan con un iframe simple, sin JavaScript de nadie.
 */

export type Platform =
  | 'youtube'
  | 'twitch'
  | 'x'
  | 'facebook'
  | 'tiktok'
  | 'instagram'
  | 'kick'
  | 'other';

export interface DetectedLink {
  platform: Platform;
  /** Identificador del video dentro de la plataforma, si se pudo extraer. */
  embedId: string | null;
  /** Si se puede mostrar dentro del sitio sin scripts de terceros. */
  embeddable: boolean;
  /** Miniatura deducible sin llamar a ninguna API. */
  thumbnailUrl: string | null;
  /** Nombre para mostrar al usuario. */
  label: string;
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  youtube: 'YouTube',
  twitch: 'Twitch',
  x: 'X',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  instagram: 'Instagram',
  kick: 'Kick',
  other: 'Enlace',
};

/** Color de acento por plataforma, para las tarjetas. */
export const PLATFORM_TONES: Record<
  Platform,
  'primary' | 'steel' | 'magenta' | 'orange' | 'neutral'
> = {
  youtube: 'magenta',
  twitch: 'magenta',
  x: 'neutral',
  facebook: 'steel',
  tiktok: 'steel',
  instagram: 'orange',
  kick: 'primary',
  other: 'neutral',
};

const PATTERNS: Array<{
  platform: Platform;
  regexes: RegExp[];
  embeddable: boolean;
}> = [
  {
    platform: 'youtube',
    embeddable: true,
    regexes: [
      /youtube\.com\/watch\?(?:.*&)?v=([\w-]{11})/i,
      /youtu\.be\/([\w-]{11})/i,
      /youtube\.com\/shorts\/([\w-]{11})/i,
      /youtube\.com\/live\/([\w-]{11})/i,
      /youtube\.com\/embed\/([\w-]{11})/i,
    ],
  },
  {
    platform: 'twitch',
    embeddable: true,
    regexes: [
      /twitch\.tv\/videos\/(\d+)/i,
      /clips\.twitch\.tv\/([\w-]+)/i,
      /twitch\.tv\/\w+\/clip\/([\w-]+)/i,
    ],
  },
  {
    platform: 'x',
    embeddable: false,
    regexes: [/(?:twitter|x)\.com\/\w+\/status\/(\d+)/i],
  },
  {
    platform: 'tiktok',
    embeddable: false,
    regexes: [/tiktok\.com\/@[\w.-]+\/video\/(\d+)/i],
  },
  {
    platform: 'instagram',
    embeddable: false,
    regexes: [/instagram\.com\/(?:p|reel|reels)\/([\w-]+)/i],
  },
  {
    platform: 'facebook',
    embeddable: false,
    regexes: [/facebook\.com\/.+\/videos\/(\d+)/i, /fb\.watch\/([\w-]+)/i],
  },
  {
    platform: 'kick',
    embeddable: false,
    regexes: [/kick\.com\/video\/([\w-]+)/i, /kick\.com\/\w+\?clip=([\w-]+)/i],
  },
];

/** Marca si el identificador de Twitch es un clip o un video grabado. */
function isTwitchClip(url: string): boolean {
  return /clips\.twitch\.tv|\/clip\//i.test(url);
}

/**
 * Analiza una URL pegada por el administrador y devuelve lo que se sabe de ella.
 * Nunca lanza: una URL desconocida devuelve `other`, que también es válido.
 */
export function detectLink(rawUrl: string): DetectedLink {
  const url = rawUrl.trim();

  for (const entry of PATTERNS) {
    for (const regex of entry.regexes) {
      const match = url.match(regex);
      if (!match) continue;

      const id = match[1] ?? null;

      // La miniatura de YouTube se puede construir sin llamar a ninguna API.
      // En el resto de plataformas haría falta su API o subir una imagen.
      const thumbnailUrl =
        entry.platform === 'youtube' && id
          ? `https://img.youtube.com/vi/${id}/hqdefault.jpg`
          : null;

      return {
        platform: entry.platform,
        embedId:
          entry.platform === 'twitch' && id
            ? `${isTwitchClip(url) ? 'clip:' : 'video:'}${id}`
            : id,
        embeddable: entry.embeddable && Boolean(id),
        thumbnailUrl,
        label: PLATFORM_LABELS[entry.platform],
      };
    }
  }

  return {
    platform: 'other',
    embedId: null,
    embeddable: false,
    thumbnailUrl: null,
    label: PLATFORM_LABELS.other,
  };
}

/**
 * URL del reproductor incrustado.
 *
 * Twitch exige el parámetro `parent` con el dominio desde el que se muestra, y
 * lo verifica: si no coincide, el reproductor devuelve un error en lugar del
 * video. Se toma del navegador para que funcione igual en ssfxmx.github.io, en
 * localhost y en un dominio propio futuro, sin tocar código.
 */
export function embedUrl(platform: Platform, embedId: string | null): string | null {
  if (!embedId) return null;

  if (platform === 'youtube') {
    return `https://www.youtube-nocookie.com/embed/${embedId}?rel=0`;
  }

  if (platform === 'twitch') {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const [kind, id] = embedId.split(':');

    if (kind === 'clip') {
      return `https://clips.twitch.tv/embed?clip=${id}&parent=${host}&autoplay=false`;
    }
    return `https://player.twitch.tv/?video=${id}&parent=${host}&autoplay=false`;
  }

  return null;
}
