import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '@/shared/constants/routes';
import { formatDate } from '@/shared/utils/date';
import { PageMeta } from '@/shared/components/seo/PageMeta';
import {
  ArcadePanel,
  EmptyState,
  ErrorState,
  SectionTitle,
  Spinner,
} from '@/shared/components/ui';
import { PLATFORM_LABELS, type Platform } from '@/shared/utils/socialLinks';
import { useHighlights } from '../hooks';
import { HighlightCard, HighlightPlayer, PlatformBadge } from '../components/HighlightPlayer';

/**
 * Galería de highlights.
 *
 * El destacado se muestra grande arriba y el resto en cuadrícula. Los
 * reproductores incrustados usan carga diferida, así que abrir esta página con
 * treinta clips no descarga treinta reproductores.
 */
export function HighlightsPage() {
  const { data, isLoading, isError, refetch } = useHighlights();
  const [platform, setPlatform] = useState<Platform | 'all'>('all');

  const platforms = useMemo(() => {
    const set = new Set((data ?? []).map((item) => item.platform));
    return [...set];
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return platform === 'all' ? data : data.filter((item) => item.platform === platform);
  }, [data, platform]);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <>
      <PageMeta
        title="Highlights"
        description="Los mejores combates de la comunidad SSF2X México."
      />

      <SectionTitle>HIGHLIGHTS</SectionTitle>

      {isLoading && <Spinner />}
      {isError && <ErrorState onRetry={() => refetch()} />}

      {!isLoading && (data?.length ?? 0) === 0 && (
        <EmptyState
          title="Todavía no hay clips"
          message="Cuando se publique el primer combate memorable, aparecerá aquí."
        />
      )}

      {platforms.length > 1 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setPlatform('all')}
            className={[
              'rounded border px-3 py-1.5 text-xs transition-colors',
              platform === 'all'
                ? 'border-primary bg-primary/15 text-primary'
                : 'border-edge text-ink-soft hover:border-steel hover:text-steel',
            ].join(' ')}
          >
            Todos
          </button>
          {platforms.map((item) => (
            <button
              key={item}
              onClick={() => setPlatform(item)}
              className={[
                'rounded border px-3 py-1.5 text-xs transition-colors',
                platform === item
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-edge text-ink-soft hover:border-steel hover:text-steel',
              ].join(' ')}
            >
              {PLATFORM_LABELS[item]}
            </button>
          ))}
        </div>
      )}

      {featured && (
        <section className="mb-12">
          <ArcadePanel glow className="overflow-hidden">
            <HighlightPlayer
              platform={featured.platform}
              embedId={featured.embed_id}
              url={featured.url}
              title={featured.title}
              thumbnailUrl={featured.thumbnail_url}
            />

            <div className="space-y-3 p-6">
              <div className="flex flex-wrap items-center gap-3">
                <PlatformBadge platform={featured.platform} />
                {featured.event_slug && featured.event_name && (
                  <Link
                    to={routes.eventDetail(featured.event_slug)}
                    className="text-xs text-steel hover:text-primary"
                  >
                    {featured.event_name}
                  </Link>
                )}
                {featured.published_at && (
                  <span className="text-xs text-ink-dim">
                    {formatDate(featured.published_at)}
                  </span>
                )}
              </div>

              <h2 className="font-display text-sm leading-relaxed text-primary neon-text">
                {featured.title}
              </h2>

              {featured.description && (
                <p className="max-w-2xl text-sm leading-relaxed text-ink-soft">
                  {featured.description}
                </p>
              )}
            </div>
          </ArcadePanel>
        </section>
      )}

      {rest.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((item) => (
            <HighlightCard
              key={item.id}
              title={item.title}
              description={item.description}
              url={item.url}
              platform={item.platform}
              embedId={item.embed_id}
              thumbnailUrl={item.thumbnail_url}
              eventName={item.event_name}
            />
          ))}
        </div>
      )}
    </>
  );
}
