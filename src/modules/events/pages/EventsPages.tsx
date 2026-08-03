import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, ExternalLink, MapPin, Radio, Users } from 'lucide-react';
import { routes } from '@/shared/constants/routes';
import { storagePublicUrl } from '@/shared/lib/supabase';
import { useDebounce } from '@/shared/hooks';
import {
  formatDate,
  formatDateTime,
  monthKey,
  monthLabel,
} from '@/shared/utils/date';
import { stripMarkdown, truncate } from '@/shared/utils/format';
import { PageMeta } from '@/shared/components/seo/PageMeta';
import { Markdown } from '@/shared/components/ui/Markdown';
import {
  ArcadePanel,
  Badge,
  EmptyState,
  ErrorState,
  LinkButton,
  Pagination,
  SectionTitle,
  Spinner,
} from '@/shared/components/ui';
import { FilterBar, yearOptions } from '@/shared/components/ui/FilterBar';
import { ShareButton } from '@/shared/components/ui/ShareButton';
import { useResultsByEvent } from '@/modules/results/hooks';
import { ResultsTable } from '@/modules/results/components/ResultsTable';
import type { EventRecord } from '@/shared/types/database';
import {
  useEventDetail,
  useOldestEventYear,
  usePastEvents,
  useUpcomingEvents,
  useVisibleEvents,
} from '../hooks';
import { EventCard, EventStatusBadge, KIND_LABELS, MODE_LABELS } from '../components/EventBits';

/* ========================================================================== */
/* Listado                                                                     */
/* ========================================================================== */

const PAST_PAGE_SIZE = 12;

export function EventsListPage() {
  const upcoming = useUpcomingEvents();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('');
  const [kind, setKind] = useState('');

  const debouncedSearch = useDebounce(search, 300);
  const past = usePastEvents(page, PAST_PAGE_SIZE, {
    search: debouncedSearch,
    year,
    kind,
  });
  const oldestYear = useOldestEventYear();

  // Vuelve a la primera página al cambiar cualquier filtro: si no, se puede
  // acabar en una página que ya no existe dentro del nuevo resultado.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, year, kind]);

  const total = past.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAST_PAGE_SIZE));
  const isFiltering = debouncedSearch.trim() !== '' || year !== '' || kind !== '';

  return (
    <>
      <PageMeta
        title="Eventos"
        description="Próximos torneos y eventos de la comunidad SSF2X México."
      />

      <SectionTitle
        action={
          <LinkButton to={routes.calendar} variant="secondary" size="sm">
            <CalendarDays size={15} /> Ver calendario
          </LinkButton>
        }
      >
        PRÓXIMOS EVENTOS
      </SectionTitle>

      {upcoming.isLoading && <Spinner />}
      {upcoming.isError && <ErrorState onRetry={() => upcoming.refetch()} />}
      {upcoming.data?.length === 0 && (
        <EmptyState
          title="No hay eventos programados"
          message="En cuanto se anuncie el próximo torneo, aparecerá aquí."
        />
      )}
      {upcoming.data && upcoming.data.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.data.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      <div className="mt-16">
        <SectionTitle>EVENTOS PASADOS</SectionTitle>

        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar por nombre…"
          filters={[
            {
              value: year,
              onChange: setYear,
              options: yearOptions(oldestYear.data ?? null),
              allLabel: 'Todos los años',
              ariaLabel: 'Filtrar por año',
            },
            {
              value: kind,
              onChange: setKind,
              options: Object.entries(KIND_LABELS).map(([value, label]) => ({
                value,
                label,
              })),
              allLabel: 'Todos los tipos',
              ariaLabel: 'Filtrar por tipo de evento',
            },
          ]}
          resultLabel={
            past.data ? `${total} ${total === 1 ? 'evento' : 'eventos'}` : undefined
          }
        />

        {past.isLoading && <Spinner />}
        {past.isError && <ErrorState onRetry={() => past.refetch()} />}

        {past.data && past.data.items.length === 0 && (
          <EmptyState
            title={isFiltering ? 'Sin resultados' : 'Todavía no hay historial'}
            message={
              isFiltering
                ? 'Prueba con otras palabras o quita alguno de los filtros.'
                : 'Aquí quedará el archivo de torneos.'
            }
          />
        )}

        {past.data && past.data.items.length > 0 && (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {past.data.items.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>
    </>
  );
}

/* ========================================================================== */
/* Calendario                                                                  */
/* ========================================================================== */

/**
 * Calendario agrupado por mes.
 *
 * Se eligió una lista por meses en lugar de una cuadrícula tipo mes-completo:
 * con uno o dos eventos al mes, una cuadrícula sería un mar de celdas vacías, y
 * además la lista funciona mucho mejor en teléfono, que es donde se va a ver.
 */
export function CalendarPage() {
  const { data, isLoading, isError, refetch } = useVisibleEvents();

  const grouped = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, EventRecord[]>();
    for (const event of data) {
      const key = monthKey(event.starts_at);
      const list = map.get(key);
      if (list) list.push(event);
      else map.set(key, [event]);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [data]);

  return (
    <>
      <PageMeta title="Calendario" description="Calendario de eventos de SSF2X México." />

      <SectionTitle
        action={
          <LinkButton to={routes.events} variant="secondary" size="sm">
            Ver como tarjetas
          </LinkButton>
        }
      >
        CALENDARIO
      </SectionTitle>

      {isLoading && <Spinner />}
      {isError && <ErrorState onRetry={() => refetch()} />}
      {grouped.length === 0 && !isLoading && (
        <EmptyState title="Sin eventos" message="Aún no hay nada en el calendario." />
      )}

      <div className="space-y-10">
        {grouped.map(([key, events]) => (
          <section key={key}>
            <h3 className="mb-4 font-display text-xs text-steel">
              {monthLabel(events[0]!.starts_at).toUpperCase()}
            </h3>
            <div className="space-y-3">
              {events.map((event) => (
                <Link key={event.id} to={routes.eventDetail(event.slug)} className="block">
                  <ArcadePanel
                    beveled={false}
                    className="flex flex-wrap items-center gap-4 p-4 transition-colors hover:border-primary/60"
                  >
                    <div className="w-14 shrink-0 text-center">
                      <div className="font-display text-lg text-primary">
                        {new Date(event.starts_at).getDate()}
                      </div>
                      <div className="text-[10px] uppercase text-ink-dim">
                        {formatDate(event.starts_at).split(' ')[2]?.slice(0, 3)}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink">{event.name}</p>
                      <p className="text-xs text-ink-dim">
                        {KIND_LABELS[event.kind]} · {MODE_LABELS[event.mode]}
                      </p>
                    </div>

                    <EventStatusBadge status={event.status} />
                  </ArcadePanel>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

/* ========================================================================== */
/* Detalle                                                                     */
/* ========================================================================== */

export function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, isError, refetch } = useEventDetail(slug);
  const results = useResultsByEvent(slug);

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (!data) return <EmptyState title="Evento no encontrado" />;

  const cover = storagePublicUrl('media', data.cover_path);
  const extras = Object.entries(data.extra ?? {}).filter(([, value]) => value);

  return (
    <article className="mx-auto max-w-3xl">
      <PageMeta
        title={data.name}
        description={truncate(stripMarkdown(data.description_md), 160) || data.name}
        image={cover}
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          to={routes.events}
          className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-primary"
        >
          <ArrowLeft size={16} /> Volver a eventos
        </Link>

        {/* La fecha va en el texto que se comparte: un enlace suelto en un chat
            no dice cuándo es, y eso es justo lo que hay que saber para decidir
            si se entra. */}
        <ShareButton
          title={data.name}
          text={`${formatDateTime(data.starts_at)} · ${MODE_LABELS[data.mode] ?? data.mode}`}
        />
      </div>

      <header className="mb-8 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <EventStatusBadge status={data.status} />
          <Badge>{KIND_LABELS[data.kind] ?? data.kind}</Badge>
          <Badge tone="steel">{MODE_LABELS[data.mode] ?? data.mode}</Badge>
        </div>

        <h1 className="font-display text-xl leading-relaxed text-primary neon-text sm:text-2xl">
          {data.name}
        </h1>

        <div className="h-1 w-full bg-gradient-to-r from-primary via-magenta to-transparent" />
      </header>

      {cover && (
        <img src={cover} alt="" className="mb-8 w-full rounded-lg border border-edge" />
      )}

      <ArcadePanel className="mb-8 p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <CalendarDays size={18} className="mt-0.5 shrink-0 text-primary" />
            <div>
              <dt className="text-xs uppercase text-ink-dim">Fecha y hora</dt>
              <dd className="text-sm text-ink">{formatDateTime(data.starts_at)}</dd>
              {data.ends_at && (
                <dd className="text-xs text-ink-dim">Termina: {formatDateTime(data.ends_at)}</dd>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            {data.mode === 'online' ? (
              <Radio size={18} className="mt-0.5 shrink-0 text-primary" />
            ) : (
              <MapPin size={18} className="mt-0.5 shrink-0 text-primary" />
            )}
            <div>
              <dt className="text-xs uppercase text-ink-dim">Lugar</dt>
              <dd className="text-sm text-ink">
                {data.venue_name ?? MODE_LABELS[data.mode]}
              </dd>
              {data.venue_address && (
                <dd className="text-xs text-ink-dim">{data.venue_address}</dd>
              )}
            </div>
          </div>

          {data.max_participants && (
            <div className="flex items-start gap-3">
              <Users size={18} className="mt-0.5 shrink-0 text-primary" />
              <div>
                <dt className="text-xs uppercase text-ink-dim">Cupo</dt>
                <dd className="text-sm text-ink">{data.max_participants} jugadores</dd>
              </div>
            </div>
          )}

          {extras.map(([key, value]) => (
            <div key={key} className="flex items-start gap-3">
              <span className="mt-0.5 h-4 w-1 shrink-0 bg-primary" />
              <div>
                <dt className="text-xs uppercase text-ink-dim">{key.replace(/_/g, ' ')}</dt>
                <dd className="text-sm text-ink">{String(value)}</dd>
              </div>
            </div>
          ))}
        </dl>

        {(data.registration_url || data.stream_url) && (
          <div className="mt-6 flex flex-wrap gap-3 border-t border-edge pt-6">
            {data.registration_url && (
              <a
                href={data.registration_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-2 rounded bg-primary px-4 py-2.5 text-sm font-semibold text-base hover:bg-primary/85"
              >
                Inscribirse <ExternalLink size={14} />
              </a>
            )}
            {data.stream_url && (
              <a
                href={data.stream_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-2 rounded border border-edge bg-surface-raised px-4 py-2.5 text-sm hover:border-steel hover:text-steel"
              >
                Ver transmisión <ExternalLink size={14} />
              </a>
            )}
          </div>
        )}
      </ArcadePanel>

      {data.description_md && <Markdown>{data.description_md}</Markdown>}

      {results.data && results.data.length > 0 && (
        <section className="mt-12">
          <SectionTitle>RESULTADOS</SectionTitle>
          <ResultsTable results={results.data} />
        </section>
      )}
    </article>
  );
}
