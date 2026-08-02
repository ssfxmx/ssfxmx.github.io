import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { routes } from '@/shared/constants/routes';
import { ArcadePanel, EmptyState, Spinner } from '@/shared/components/ui';
import {
  fetchCharacterUsage,
  fetchPlayerRanking,
} from '@/modules/stats/services/stats.service';
import {
  CharacterMeta,
  PlayerRanking,
  StatsSummary,
} from '@/modules/stats/components/StatsBoards';
import { AdminHeader } from '../shared/AdminKit';

/**
 * Reportes del panel.
 *
 * Muestra exactamente lo mismo que la página pública, reutilizando los mismos
 * componentes: si un día cambia cómo se ordena el ranking, cambia en los dos
 * sitios a la vez. Duplicar la tabla habría garantizado que tarde o temprano
 * mostraran cifras distintas.
 *
 * Lo que sí es propio del panel es el aviso de captura pendiente: datos que
 * faltan y que solo un administrador puede arreglar.
 */
export function AdminReportsPage() {
  const players = useQuery({ queryKey: ['stats', 'players'], queryFn: fetchPlayerRanking });
  const characters = useQuery({
    queryKey: ['stats', 'characters'],
    queryFn: fetchCharacterUsage,
  });

  if (players.isLoading || characters.isLoading) return <Spinner />;

  const playerRows = players.data ?? [];
  const charRows = characters.data ?? [];
  const sinPersonaje = charRows.every((character) => character.times_placed === 0);

  return (
    <>
      <AdminHeader
        title="REPORTES"
        description="Se calcula solo a partir de los resultados capturados. No hay nada que actualizar a mano."
        action={
          <Link
            to={routes.stats}
            className="inline-flex items-center gap-1.5 text-sm text-steel hover:text-primary"
          >
            Ver versión pública <ExternalLink size={14} />
          </Link>
        }
      />

      {playerRows.length === 0 ? (
        <EmptyState
          title="Aún no hay datos"
          message="Las estadísticas aparecen en cuanto captures los resultados del primer torneo."
        />
      ) : (
        <div className="space-y-8">
          {sinPersonaje && (
            <ArcadePanel beveled={false} className="border-primary/40 p-4">
              <p className="text-sm text-ink-soft">
                <strong className="text-primary">Falta el personaje en los resultados.</strong>{' '}
                Ningún resultado tiene personaje registrado, así que las estadísticas de
                meta-juego están vacías. Al capturar torneos, elige el personaje de cada
                jugador: es un dato que no se puede reconstruir después.
              </p>
            </ArcadePanel>
          )}

          <StatsSummary players={playerRows} characters={charRows} />

          <section>
            <h2 className="mb-3 font-display text-[10px] uppercase tracking-wide text-steel">
              Ranking de jugadores
            </h2>
            <PlayerRanking players={playerRows} />
          </section>

          <section>
            <h2 className="mb-3 font-display text-[10px] uppercase tracking-wide text-steel">
              Personajes en el podio
            </h2>
            <CharacterMeta characters={charRows} />
          </section>
        </div>
      )}
    </>
  );
}
