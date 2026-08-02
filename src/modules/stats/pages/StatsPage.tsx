import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { routes } from '@/shared/constants/routes';
import { PageMeta } from '@/shared/components/seo/PageMeta';
import { ArcadePanel, ErrorState, SectionTitle, Spinner } from '@/shared/components/ui';
import {
  fetchCharacterUsage,
  fetchPlayerRanking,
  fetchTournamentCount,
} from '../services/stats.service';
import { CharacterMeta, PlayerRanking, StatsSummary } from '../components/StatsBoards';

/**
 * Estadísticas públicas.
 *
 * Es la página que más veces va a revisar la gente que ya juega: quieren ver su
 * posición. Por eso es pública y no solo del panel.
 *
 * ADVERTENCIA DE MUESTRA PEQUEÑA
 * Con uno o dos torneos, un ranking es engañoso: quien ganó una vez aparece
 * primero para siempre. En lugar de esconder la página hasta tener datos
 * suficientes, se muestra un aviso con cuántos torneos lo respaldan. Es más
 * honesto que un número sin contexto, y deja de aparecer solo cuando la muestra
 * ya es razonable.
 */
export function StatsPage() {
  const players = useQuery({ queryKey: ['stats', 'players'], queryFn: fetchPlayerRanking });
  const characters = useQuery({
    queryKey: ['stats', 'characters'],
    queryFn: fetchCharacterUsage,
  });
  const tournaments = useQuery({
    queryKey: ['stats', 'tournaments'],
    queryFn: fetchTournamentCount,
  });

  if (players.isLoading || characters.isLoading) return <Spinner />;
  if (players.isError) return <ErrorState onRetry={() => players.refetch()} />;

  const count = tournaments.data ?? 0;

  return (
    <>
      <PageMeta
        title="Estadísticas"
        description="Ranking de jugadores y personajes más usados en los torneos de SSF2X México."
      />

      <SectionTitle>ESTADÍSTICAS</SectionTitle>

      {count > 0 && count < 4 && (
        <ArcadePanel beveled={false} className="mb-6 border-primary/40 p-4">
          <p className="text-sm text-ink-soft">
            <strong className="text-primary">Todavía hay pocos datos.</strong> Estas cifras
            salen de {count === 1 ? 'un solo torneo' : `${count} torneos`}, así que tómalas
            como una foto del momento y no como una clasificación asentada.
          </p>
        </ArcadePanel>
      )}

      <div className="mb-10">
        <StatsSummary players={players.data ?? []} characters={characters.data ?? []} />
      </div>

      <section className="mb-12">
        <h2 className="mb-3 font-display text-xs text-steel">RANKING</h2>
        <PlayerRanking players={players.data ?? []} />
        <p className="mt-2 text-xs text-ink-dim">
          Ordenado por campeonatos, luego podios, luego posición media. Los jugadores
          invitados no aparecen aquí: sus resultados sí están en el historial de cada
          torneo, pero solo se acumulan si tienen cuenta.{' '}
          <Link to={routes.register} className="text-steel hover:text-primary">
            Regístrate
          </Link>{' '}
          para que los tuyos cuenten.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xs text-steel">PERSONAJES EN EL PODIO</h2>
        <CharacterMeta characters={characters.data ?? []} />
        <p className="mt-2 text-xs text-ink-dim">
          La barra mide cuántas veces apareció ese personaje en un resultado. Se toma del
          personaje registrado en cada torneo, no del main del perfil, así que refleja lo
          que de verdad se jugó.
        </p>
      </section>
    </>
  );
}
