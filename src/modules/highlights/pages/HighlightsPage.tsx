import { useMemo, useState } from 'react';
import { PageMeta } from '@/shared/components/seo/PageMeta';
import { EmptyState, ErrorState, SectionTitle, Spinner } from '@/shared/components/ui';
import { PLATFORM_LABELS, type Platform } from '@/shared/utils/socialLinks';
import { useHighlights } from '../hooks';
import { HighlightCard } from '../components/HighlightPlayer';

/**
 * Galería de highlights.
 *
 * DOS PROBLEMAS DE LA PRIMERA VERSIÓN, resueltos aquí:
 *
 * 1. Un destacado enorme a ancho completo. Con un clip vertical dejaba dos
 *    franjas negras que ocupaban más de la mitad de la pantalla. Ahora el
 *    destacado es una tarjeta más de la galería, marcada con borde y etiqueta.
 *
 * 2. Cuadrícula de altura uniforme. Mezclar videos verticales y horizontales en
 *    filas iguales obliga a recortar unos o dejar huecos en otros. Se usa
 *    disposición en columnas (masonry con CSS puro): cada tarjeta ocupa el alto
 *    que necesita y se acomoda sola, sin librerías ni cálculos en JavaScript.
 */
export function HighlightsPage() {
  const { data, isLoading, isError, refetch } = useHighlights();
  const [platform, setPlatform] = useState<Platform | 'all'>('all');

  const platforms = useMemo(() => {
    const set = new Set((data ?? []).map((item) => item.platform));
    return [...set];
  }, [data]);

  const visible = useMemo(() => {
    if (!data) return [];
    return platform === 'all' ? data : data.filter((item) => item.platform === platform);
  }, [data, platform]);

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
          <FilterChip
            active={platform === 'all'}
            onClick={() => setPlatform('all')}
            label="Todos"
          />
          {platforms.map((item) => (
            <FilterChip
              key={item}
              active={platform === item}
              onClick={() => setPlatform(item)}
              label={PLATFORM_LABELS[item]}
            />
          ))}
        </div>
      )}

      {/* Columnas CSS: cada tarjeta conserva su alto natural y se acomoda sola.
          `break-inside-avoid` impide que una tarjeta se parta entre columnas. */}
      <div className="columns-1 gap-5 sm:columns-2 xl:columns-3 [&>*]:mb-5 [&>*]:break-inside-avoid">
        {visible.map((item) => (
          <HighlightCard
            key={item.id}
            title={item.title}
            description={item.description}
            url={item.url}
            platform={item.platform}
            embedId={item.embed_id}
            thumbnailUrl={item.thumbnail_url}
            eventName={item.event_name}
            featured={item.is_featured}
          />
        ))}
      </div>
    </>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'rounded border px-3 py-1.5 text-xs transition-colors',
        active
          ? 'border-primary bg-primary/15 text-primary'
          : 'border-edge text-ink-soft hover:border-steel hover:text-steel',
      ].join(' ')}
    >
      {label}
    </button>
  );
}
