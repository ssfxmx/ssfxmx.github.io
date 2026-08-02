import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Play, X } from 'lucide-react';
import { routes } from '@/shared/constants/routes';
import { formatDate } from '@/shared/utils/date';
import { ArcadePanel, Badge } from '@/shared/components/ui';
import {
  detectOrientation,
  PLATFORM_LABELS,
  thumbnailFor,
  type Platform,
} from '@/shared/utils/socialLinks';
import type { HighlightPublic } from '../services/highlights.service';
import { HighlightPlayer, PlatformBadge } from './HighlightPlayer';

/**
 * Vistas de la galería.
 *
 * DECISIÓN CENTRAL: en los listados se muestran IMÁGENES, no reproductores.
 *
 * Un iframe de YouTube pesa cientos de kilobytes y abre varias conexiones. Con
 * treinta clips en pantalla, la página tardaría una eternidad y el teléfono se
 * calentaría. Con miniaturas, la galería carga al instante y el reproductor
 * solo aparece cuando alguien decide ver algo.
 *
 * Es además lo que permite que las miniaturas sean pequeñas de verdad: un
 * reproductor tiene un tamaño mínimo usable, una imagen no.
 */

function Placeholder({ platform }: { platform: Platform }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-surface-raised">
      <Play size={20} className="text-ink-dim" />
      <span className="text-[10px] uppercase tracking-wide text-ink-dim">
        {PLATFORM_LABELS[platform]}
      </span>
    </div>
  );
}

/* ========================================================================== */
/* Cuadrícula de miniaturas                                                    */
/* ========================================================================== */

export function HighlightGrid({
  items,
  onOpen,
}: {
  items: HighlightPublic[];
  onOpen: (item: HighlightPublic) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((item) => {
        const thumb = thumbnailFor(item.platform, item.embed_id, item.thumbnail_url);

        return (
          <button
            key={item.id}
            onClick={() => onOpen(item)}
            className="group text-left"
            aria-label={`Ver ${item.title}`}
          >
            {/* Proporción uniforme en toda la cuadrícula: mezclar altos deja la
                galería desordenada. El recorte centrado funciona bien porque
                la acción del clip casi siempre está en el centro. */}
            <div className="relative aspect-[3/4] overflow-hidden rounded border border-edge bg-surface transition-colors group-hover:border-primary/60">
              {thumb ? (
                <img
                  src={thumb}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <Placeholder platform={item.platform} />
              )}

              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/50 bg-base/90">
                  <Play size={18} className="ml-0.5 text-primary" />
                </span>
              </div>

              {item.is_featured && (
                <span className="absolute left-1.5 top-1.5 rounded-sm bg-primary px-1.5 py-0.5 text-[9px] font-semibold text-base">
                  ★
                </span>
              )}
            </div>

            <p className="mt-2 line-clamp-2 text-xs leading-snug text-ink-soft group-hover:text-primary">
              {item.title}
            </p>
          </button>
        );
      })}
    </div>
  );
}

/* ========================================================================== */
/* Listado                                                                     */
/* ========================================================================== */

export function HighlightList({
  items,
  onOpen,
}: {
  items: HighlightPublic[];
  onOpen: (item: HighlightPublic) => void;
}) {
  return (
    <ArcadePanel beveled={false} className="divide-y divide-edge">
      {items.map((item) => {
        const thumb = thumbnailFor(item.platform, item.embed_id, item.thumbnail_url);

        return (
          <div key={item.id} className="flex gap-4 p-3 transition-colors hover:bg-surface-raised/40">
            <button
              onClick={() => onOpen(item)}
              className="group relative h-16 w-24 shrink-0 overflow-hidden rounded border border-edge bg-surface"
              aria-label={`Ver ${item.title}`}
            >
              {thumb ? (
                <img src={thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <Placeholder platform={item.platform} />
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                <Play size={16} className="text-primary" />
              </span>
            </button>

            <div className="min-w-0 flex-1">
              <button
                onClick={() => onOpen(item)}
                className="block text-left font-medium leading-snug text-ink hover:text-primary"
              >
                {item.title}
              </button>

              {item.description && (
                <p className="mt-0.5 line-clamp-1 text-sm text-ink-soft">{item.description}</p>
              )}

              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <PlatformBadge platform={item.platform} />
                {item.event_slug && item.event_name && (
                  <Link
                    to={routes.eventDetail(item.event_slug)}
                    className="text-xs text-steel hover:text-primary"
                  >
                    {item.event_name}
                  </Link>
                )}
                {item.published_at && (
                  <span className="text-xs text-ink-dim">{formatDate(item.published_at)}</span>
                )}
                {item.is_featured && <Badge tone="primary">Destacado</Badge>}
              </div>
            </div>
          </div>
        );
      })}
    </ArcadePanel>
  );
}

/* ========================================================================== */
/* Reproductor a pantalla completa                                             */
/* ========================================================================== */

/**
 * Se abre al elegir un clip. Aquí sí se carga el iframe: uno solo, el que la
 * persona pidió ver.
 *
 * Cierra con Escape y al hacer clic fuera, que es lo que la gente intenta antes
 * de buscar el botón.
 */
export function HighlightLightbox({
  item,
  onClose,
}: {
  item: HighlightPublic | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!item) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [item, onClose]);

  if (!item) return null;

  const vertical = detectOrientation(item.url) === 'portrait';

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-black/85 p-4 py-10"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
    >
      <div
        className="mx-auto w-full max-w-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate font-semibold text-white">{item.title}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <PlatformBadge platform={item.platform} />
              {item.event_name && (
                <span className="text-xs text-white/60">{item.event_name}</span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="shrink-0 rounded border border-white/20 p-2 text-white/70 transition-colors hover:border-white/50 hover:text-white"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Los verticales se limitan en ancho: a pantalla completa serían una
            columna altísima que obligaría a desplazarse para ver el combate. */}
        <div className={vertical ? 'mx-auto max-w-sm' : ''}>
          <HighlightPlayer
            platform={item.platform}
            embedId={item.embed_id}
            url={item.url}
            title={item.title}
            thumbnailUrl={item.thumbnail_url}
          />
        </div>

        {item.description && (
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/70">
            {item.description}
          </p>
        )}

        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-primary"
        >
          Abrir en {PLATFORM_LABELS[item.platform]} <ExternalLink size={13} />
        </a>
      </div>
    </div>
  );
}
