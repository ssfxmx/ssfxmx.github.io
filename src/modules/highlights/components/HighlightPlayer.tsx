import { ExternalLink, Play } from 'lucide-react';
import { ArcadePanel, Badge } from '@/shared/components/ui';
import {
  detectOrientation,
  embedUrl,
  PLATFORM_LABELS,
  PLATFORM_TONES,
  type Orientation,
  type Platform,
} from '@/shared/utils/socialLinks';

/**
 * Reproductor de un highlight.
 *
 * YouTube y Twitch se muestran dentro del sitio con un iframe. El resto se
 * presenta como tarjeta que abre la publicación original, porque incrustarlas
 * exigiría cargar sus scripts: rastreadores de terceros para todos los
 * visitantes y una página que se rompe cuando ellos cambian algo.
 *
 * PROPORCIÓN. El marco se adapta al video: 16:9 para los horizontales y 9:16
 * para Shorts, Reels y TikTok. Meter un vertical en un marco horizontal deja
 * dos franjas negras que se comen más de la mitad del ancho, y en una galería
 * donde la mayoría de los clips son cortos verticales, eso es casi toda la
 * página desperdiciada.
 */
export function HighlightPlayer({
  platform,
  embedId,
  url,
  title,
  thumbnailUrl,
  orientation,
}: {
  platform: Platform;
  embedId: string | null;
  url: string;
  title: string;
  thumbnailUrl?: string | null;
  orientation?: Orientation;
}) {
  const src = embedUrl(platform, embedId);
  const shape = orientation ?? detectOrientation(url);
  const frame = shape === 'portrait' ? 'aspect-[9/16]' : 'aspect-video';

  if (src) {
    return (
      <div
        className={`relative ${frame} w-full overflow-hidden rounded-lg border border-edge bg-black`}
      >
        <iframe
          src={src}
          title={title}
          loading="lazy"
          allowFullScreen
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
      aria-label={`Ver en ${PLATFORM_LABELS[platform]}: ${title}`}
    >
      <div
        className={`relative flex ${frame} w-full items-center justify-center overflow-hidden rounded-lg border border-edge bg-surface-raised transition-colors group-hover:border-primary/60`}
      >
        {thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-50"
          />
        )}

        <div className="relative flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/40 bg-base/80 transition-transform group-hover:scale-110">
            <Play size={22} className="ml-0.5 text-primary" />
          </span>
          <span className="flex items-center gap-1.5 text-sm text-ink-soft">
            Ver en {PLATFORM_LABELS[platform]} <ExternalLink size={13} />
          </span>
        </div>
      </div>
    </a>
  );
}

export function PlatformBadge({ platform }: { platform: Platform }) {
  return <Badge tone={PLATFORM_TONES[platform]}>{PLATFORM_LABELS[platform]}</Badge>;
}

/** Tarjeta de highlight para la galería. */
export function HighlightCard({
  title,
  description,
  url,
  platform,
  embedId,
  thumbnailUrl,
  eventName,
  featured = false,
}: {
  title: string;
  description?: string | null;
  url: string;
  platform: Platform;
  embedId: string | null;
  thumbnailUrl?: string | null;
  eventName?: string | null;
  featured?: boolean;
}) {
  return (
    <ArcadePanel
      className={[
        'flex flex-col overflow-hidden',
        featured ? 'border-primary/50 shadow-neon' : '',
      ].join(' ')}
    >
      <HighlightPlayer
        platform={platform}
        embedId={embedId}
        url={url}
        title={title}
        thumbnailUrl={thumbnailUrl}
      />

      <div className="flex flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {featured && <Badge tone="primary">Destacado</Badge>}
          <PlatformBadge platform={platform} />
          {eventName && <span className="text-xs text-ink-dim">{eventName}</span>}
        </div>

        <h3 className="font-semibold leading-snug text-ink">{title}</h3>

        {description && (
          <p className="text-sm leading-relaxed text-ink-soft">{description}</p>
        )}
      </div>
    </ArcadePanel>
  );
}
