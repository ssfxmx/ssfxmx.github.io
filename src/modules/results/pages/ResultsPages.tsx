import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
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
import type { EventResultPublic } from '@/shared/types/database';
import { useAllResults, useResultsByEvent } from '../hooks';
import { ResultsTable } from '../components/ResultsTable';

/* ========================================================================== */
/* Histórico                                                                   */
/* ========================================================================== */

export function ResultsListPage() {
  const { data, isLoading, isError, refetch } = useAllResults();

  /** Los resultados llegan planos; se agrupan por torneo para mostrarlos. */
  const tournaments = useMemo(() => {
    if (!data) return [];
    const map = new Map<
      string,
      { slug: string; name: string; date: string; results: EventResultPublic[] }
    >();

    for (const result of data) {
      const entry = map.get(result.event_id);
      if (entry) {
        entry.results.push(result);
      } else {
        map.set(result.event_id, {
          slug: result.event_slug,
          name: result.event_name,
          date: result.event_date,
          results: [result],
        });
      }
    }

    return [...map.values()].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [data]);

  return (
    <>
      <PageMeta
        title="Resultados"
        description="Historial completo de torneos y podios de SSF2X México."
      />

      <SectionTitle>RESULTADOS</SectionTitle>

      {isLoading && <Spinner />}
      {isError && <ErrorState onRetry={() => refetch()} />}

      {!isLoading && tournaments.length === 0 && (
        <EmptyState
          title="Todavía no hay resultados"
          message="Cuando termine el primer torneo, su podio aparecerá aquí."
        />
      )}

      <div className="space-y-10">
        {tournaments.map((tournament) => (
          <section key={tournament.slug}>
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <Link
                  to={routes.resultDetail(tournament.slug)}
                  className="font-semibold text-ink hover:text-primary"
                >
                  {tournament.name}
                </Link>
                <p className="text-xs text-ink-dim">{formatDate(tournament.date)}</p>
              </div>
              <Link
                to={routes.eventDetail(tournament.slug)}
                className="text-xs text-steel hover:text-primary"
              >
                Ver evento →
              </Link>
            </div>

            <ResultsTable results={tournament.results.slice(0, 4)} />

            {tournament.results.length > 4 && (
              <Link
                to={routes.resultDetail(tournament.slug)}
                className="mt-3 inline-block text-sm text-ink-soft hover:text-primary"
              >
                Ver las {tournament.results.length} posiciones →
              </Link>
            )}
          </section>
        ))}
      </div>
    </>
  );
}

/* ========================================================================== */
/* Detalle de torneo                                                           */
/* ========================================================================== */

export function ResultDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, isError, refetch } = useResultsByEvent(slug);

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="Sin resultados"
        message="Este torneo todavía no tiene posiciones registradas."
      />
    );
  }

  const first = data[0]!;

  return (
    <div className="mx-auto max-w-3xl">
      <PageMeta
        title={`Resultados: ${first.event_name}`}
        description={`Posiciones finales de ${first.event_name}.`}
      />

      <Link
        to={routes.results}
        className="mb-6 inline-flex items-center gap-2 text-sm text-ink-soft hover:text-primary"
      >
        <ArrowLeft size={16} /> Volver a resultados
      </Link>

      <ArcadePanel className="mb-8 p-6 text-center">
        <Trophy size={28} className="mx-auto mb-3 text-primary" />
        <h1 className="font-display text-base leading-relaxed text-primary neon-text">
          {first.event_name}
        </h1>
        <p className="mt-2 text-sm text-ink-dim">{formatDate(first.event_date)}</p>
      </ArcadePanel>

      <ResultsTable results={data} />

      <Link
        to={routes.eventDetail(first.event_slug)}
        className="mt-6 inline-block text-sm text-steel hover:text-primary"
      >
        Ver información del evento →
      </Link>
    </div>
  );
}
