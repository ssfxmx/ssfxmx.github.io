import { Link } from 'react-router-dom';
import { ArrowRight, Trophy, Users } from 'lucide-react';
import { routes } from '@/shared/constants/routes';
import { formatDate } from '@/shared/utils/date';
import { useSetting } from '@/shared/hooks';
import { PageMeta } from '@/shared/components/seo/PageMeta';
import {
  ArcadePanel,
  EnergyBar,
  LinkButton,
  SectionTitle,
  Spinner,
} from '@/shared/components/ui';
import { useNextEvent } from '@/modules/events/hooks';
import { NextEventBanner } from '@/modules/events/components/EventBits';
import { useRecentResults } from '@/modules/results/hooks';
import { ResultsTable } from '@/modules/results/components/ResultsTable';
import { useSession } from '@/modules/auth/hooks/useSession';
import { useFeaturedNews } from '../hooks';
import { NewsCard } from './NewsPages';

/**
 * Portada.
 *
 * Orden deliberado: lo primero que ve alguien que llega desde un enlace
 * compartido es cuándo es el próximo torneo. Esa es la pregunta que trae.
 */
export function HomePage() {
  const { isAuthenticated } = useSession();
  const nextEvent = useNextEvent();
  const news = useFeaturedNews(3);
  const results = useRecentResults(4);

  const tagline = useSetting<string>(
    'site.tagline',
    'La comunidad mexicana de Super Street Fighter II X'
  );
  const heroText = useSetting<string>(
    'home.hero_text',
    'Torneos mensuales, resultados y comunidad. Desde 1994, seguimos jugando.'
  );

  return (
    <>
      <PageMeta
        title="SSF2X México"
        description="Torneos mensuales, resultados y comunidad de Super Street Fighter II X en México."
      />

      {/* Héroe */}
      <section className="mb-14 text-center">
        <p className="font-display text-[10px] tracking-[0.4em] text-cyan">
          GRAND MASTER CHALLENGE
        </p>

        <h1 className="mt-5 font-display text-2xl leading-relaxed text-primary neon-text sm:text-4xl">
          SSF2X
          <br />
          MÉXICO
        </h1>

        <div className="mx-auto mt-6 max-w-xs">
          <EnergyBar value={100} />
        </div>

        <p className="mx-auto mt-6 max-w-xl text-ink-soft">{tagline}</p>
        <p className="mx-auto mt-2 max-w-xl text-sm text-ink-dim">{heroText}</p>

        {!isAuthenticated && (
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <LinkButton to={routes.register} size="lg">
              Únete a la comunidad
            </LinkButton>
            <LinkButton to={routes.tutorials} variant="secondary" size="lg">
              Cómo empezar
            </LinkButton>
          </div>
        )}
      </section>

      {/* Próximo evento */}
      {nextEvent.isLoading && <Spinner />}
      {nextEvent.data && (
        <section className="mb-14">
          <NextEventBanner event={nextEvent.data} />
        </section>
      )}
      {!nextEvent.isLoading && !nextEvent.data && (
        <ArcadePanel className="mb-14 p-8 text-center">
          <p className="animate-blink font-display text-xs text-primary">INSERT COIN</p>
          <p className="mt-3 text-sm text-ink-soft">
            No hay eventos programados por ahora. Estate atento a las noticias.
          </p>
        </ArcadePanel>
      )}

      {/* Noticias */}
      {news.data && news.data.length > 0 && (
        <section className="mb-14">
          <SectionTitle
            action={
              <Link
                to={routes.news}
                className="inline-flex items-center gap-1 text-sm text-cyan hover:text-primary"
              >
                Ver todas <ArrowRight size={14} />
              </Link>
            }
          >
            ÚLTIMAS NOTICIAS
          </SectionTitle>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {news.data.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Resultados recientes */}
      {results.data && results.data.length > 0 && (
        <section className="mb-14">
          <SectionTitle
            action={
              <Link
                to={routes.results}
                className="inline-flex items-center gap-1 text-sm text-cyan hover:text-primary"
              >
                Ver histórico <ArrowRight size={14} />
              </Link>
            }
          >
            ÚLTIMOS PODIOS
          </SectionTitle>

          <p className="mb-4 text-sm text-ink-dim">
            {results.data[0]?.event_name} · {formatDate(results.data[0]!.event_date)}
          </p>

          <ResultsTable
            results={results.data.filter((r) => r.event_id === results.data![0]!.event_id)}
          />
        </section>
      )}

      {/* Accesos rápidos */}
      <section className="grid gap-4 sm:grid-cols-2">
        <Link to={routes.players} className="group">
          <ArcadePanel className="flex items-center gap-4 p-6 transition-colors group-hover:border-primary/60">
            <Users size={28} className="shrink-0 text-primary" />
            <div>
              <h3 className="font-semibold text-ink group-hover:text-primary">Jugadores</h3>
              <p className="text-sm text-ink-soft">
                Conoce a la comunidad y sus personajes.
              </p>
            </div>
          </ArcadePanel>
        </Link>

        <Link to={routes.results} className="group">
          <ArcadePanel className="flex items-center gap-4 p-6 transition-colors group-hover:border-primary/60">
            <Trophy size={28} className="shrink-0 text-primary" />
            <div>
              <h3 className="font-semibold text-ink group-hover:text-primary">Resultados</h3>
              <p className="text-sm text-ink-soft">Todos los podios, torneo por torneo.</p>
            </div>
          </ArcadePanel>
        </Link>
      </section>
    </>
  );
}
