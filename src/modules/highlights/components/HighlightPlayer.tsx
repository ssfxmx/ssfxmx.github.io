import { ExternalLink, Play } from 'lucide-react';
import { ArcadePanel, Badge } from '@/shared/components/ui';
import {
  embedUrl,
  PLATFORM_LABELS,
  PLATFORM_TONES,
  type Platform,
} from '@/shared/utils/socialLinks';

/**
 * Reproductor de un highlight.
 *
 * YouTube y Twitch se muestran dentro del sitio con un iframe. El resto de
 * plataformas se presenta como una tarjeta que abre la publicación original,
 * porque incrustarlas exigiría cargar sus scripts: rastreadores de terceros
 * para todos los visitantes, peso extra en móvil, y una página que se rompe
 * cada vez que ellos cambian algo.
 *
 * Los iframes van con `loading="lazy"`: un listado con doce clips no debe
 * descargar doce reproductores de golpe.
 */
export function HighlightPlayer({
  platform,
  embedId,
  url,
  title,
  thumbnailUrl,
}: {
  platform: Platform;
  embedId: string | null;
  url: string;
  title: string;
  thumbnailUrl?: string | null;
}) {
  const src = embedUrl(platform, embedId);

  if (src) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-edge bg-black">
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

  // Plataformas que no se incrustan: tarjeta con enlace externo.
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
      aria-label={`Ver en ${PLATFORM_LABELS[platform]}: ${title}`}
    >
      <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border border-edge bg-surface-raised transition-colors group-hover:border-primary/60">
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

/** Tarjeta de highlight para listados. */
export function HighlightCard({
  title,
  description,
  url,
  platform,
  embedId,
  thumbnailUrl,
  eventName,
  onOpen,
}: {
  title: string;
  description?: string | null;
  url: string;
  platform: Platform;
  embedId: string | null;
  thumbnailUrl?: string | null;
  eventName?: string | null;
  onOpen?: () => void;
}) {
  return (
    <ArcadePanel className="flex h-full flex-col overflow-hidden">
      <HighlightPlayer
        platform={platform}
        embedId={embedId}
        url={url}
        title={title}
        thumbnailUrl={thumbnailUrl}
      />

      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <PlatformBadge platform={platform} />
          {eventName && <span className="text-xs text-ink-dim">{eventName}</span>}
        </div>

        <h3 className="font-semibold leading-snug text-ink">
          {onOpen ? (
            <button onClick={onOpen} className="text-left hover:text-primary">
              {title}
            </button>
          ) : (
            title
          )}
        </h3>

        {description && (
          <p className="text-sm leading-relaxed text-ink-soft">{description}</p>
        )}
      </div>
    </ArcadePanel>
  );
}
