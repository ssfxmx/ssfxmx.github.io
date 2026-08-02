import { useEffect, useMemo, useState } from 'react';
import { LayoutGrid, List, Search, X } from 'lucide-react';
import { PageMeta } from '@/shared/components/seo/PageMeta';
import {
  ArcadePanel,
  EmptyState,
  ErrorState,
  Input,
  SectionTitle,
  Spinner,
} from '@/shared/components/ui';
import { useDebounce } from '@/shared/hooks';
import { PLATFORM_LABELS, type Platform } from '@/shared/utils/socialLinks';
import type { HighlightPublic } from '../services/highlights.service';
import { useHighlights } from '../hooks';
import {
  HighlightGrid,
  HighlightLightbox,
  HighlightList,
} from '../components/HighlightViews';

type ViewMode = 'grid' | 'list';
const VIEW_KEY = 'ssf2x:highlights-view';

/**
 * Galería de highlights.
 *
 * Dos formas de ver lo mismo, porque sirven a dos intenciones distintas:
 *
 *   Miniaturas → «enséñame qué hay», se recorre con la vista
 *   Listado    → «busco algo concreto», se lee título, torneo y fecha
 *
 * La preferencia se recuerda en el navegador: quien elige listado casi siempre
 * lo prefiere para siempre, y volver a cambiarlo en cada visita molesta.
 *
 * Ninguna de las dos carga reproductores. Las miniaturas son imágenes y el
 * video solo se carga al abrir un clip. Es lo que permite que quepan muchos en
 * pantalla sin que la página se arrastre.
 */
export function HighlightsPage() {
  const { data, isLoading, isError, refetch } = useHighlights();

  const [view, setView] = useState<ViewMode>('grid');
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState<Platform | 'all'>('all');
  const [open, setOpen] = useState<HighlightPublic | null>(null);

  const query = useDebounce(search, 200);

  useEffect(() => {
    const saved = localStorage.getItem(VIEW_KEY);
    if (saved === 'grid' || saved === 'list') setView(saved);
  }, []);

  function changeView(next: ViewMode) {
    setView(next);
    localStorage.setItem(VIEW_KEY, next);
  }

  const platforms = useMemo(() => {
    const set = new Set((data ?? []).map((item) => item.platform));
    return [...set];
  }, [data]);

  /** Busca en título, descripción y nombre del torneo, sin distinguir acentos. */
  const visible = useMemo(() => {
    if (!data) return [];

    const normalize = (text: string) =>
      text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');

    const term = normalize(query.trim());

    return data.filter((item) => {
      if (platform !== 'all' && item.platform !== platform) return false;
      if (!term) return true;

      const haystack = normalize(
        [item.title, item.description ?? '', item.event_name ?? ''].join(' ')
      );
      return haystack.includes(term);
    });
  }, [data, query, platform]);

  const total = data?.length ?? 0;

  return (
    <>
      <PageMeta
        title="Highlights"
        description="Los mejores combates de la comunidad SSF2X México."
      />

      <SectionTitle>HIGHLIGHTS</SectionTitle>

      {isLoading && <Spinner />}
      {isError && <ErrorState onRetry={() => refetch()} />}

      {!isLoading && total === 0 && (
        <EmptyState
          title="Todavía no hay clips"
          message="Cuando se publique el primer combate memorable, aparecerá aquí."
        />
      )}

      {total > 0 && (
        <>
          <ArcadePanel beveled={false} className="mb-6 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[200px] flex-1">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim"
                />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por título, torneo o descripción…"
                  className="pl-9 pr-9"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-dim hover:text-ink"
                    aria-label="Limpiar búsqueda"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <div className="flex shrink-0 rounded border border-edge">
                <ViewButton
                  active={view === 'grid'}
                  onClick={() => changeView('grid')}
                  label="Miniaturas"
                >
                  <LayoutGrid size={16} />
                </ViewButton>
                <ViewButton
                  active={view === 'list'}
                  onClick={() => changeView('list')}
                  label="Listado"
                >
                  <List size={16} />
                </ViewButton>
              </div>
            </div>

            {platforms.length > 1 && (
              <div className="mt-3 flex flex-wrap gap-2">
                <FilterChip
                  active={platform === 'all'}
                  onClick={() => setPlatform('all')}
                  label="Todas"
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
          </ArcadePanel>

          <p className="mb-4 text-sm text-ink-dim">
            {visible.length === total
              ? `${total} ${total === 1 ? 'clip' : 'clips'}`
              : `${visible.length} de ${total} clips`}
          </p>

          {visible.length === 0 ? (
            <EmptyState
              title="Nada coincide"
              message="Prueba con otras palabras o quita los filtros."
            />
          ) : view === 'grid' ? (
            <HighlightGrid items={visible} onOpen={setOpen} />
          ) : (
            <HighlightList items={visible} onOpen={setOpen} />
          )}
        </>
      )}

      <HighlightLightbox item={open} onClose={() => setOpen(null)} />
    </>
  );
}

function ViewButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={[
        'flex h-[42px] w-11 items-center justify-center transition-colors first:rounded-l last:rounded-r',
        active ? 'bg-primary/15 text-primary' : 'text-ink-dim hover:text-ink',
      ].join(' ')}
    >
      {children}
    </button>
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
