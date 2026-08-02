import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/shared/lib/supabase';
import { routes } from '@/shared/constants/routes';
import { formatDate } from '@/shared/utils/date';
import { ArcadePanel, Badge, EmptyState, Spinner } from '@/shared/components/ui';
import type { CharacterUsageStats, PlayerStats } from '@/shared/types/database';
import { AdminHeader } from '../shared/AdminKit';

/**
 * Reportes.
 *
 * Todo lo que se muestra sale de vistas que ya existían en la base desde la
 * primera migración: player_stats y character_usage_stats. No hizo falta tocar
 * el esquema ni recalcular nada, que era justamente el objetivo de haberlas
 * creado antes de tener la pantalla.
 *
 * Sin gráficas a propósito. Con pocos torneos, una gráfica de barras dice menos
 * que una tabla ordenada y añade una dependencia que hay que mantener. Cuando
 * haya dos años de historial, entonces sí.
 */

async function fetchPlayerStats(): Promise<PlayerStats[]> {
  const { data, error } = await supabase
    .from('player_stats')
    .select('*')
    .gt('tournaments_played', 0)
    .order('first_places', { ascending: false })
    .order('podiums', { ascending: false })
    .order('average_position', { ascending: true });

  if (error) throw error;
  return (data ?? []) as PlayerStats[];
}

async function fetchCharacterStats(): Promise<CharacterUsageStats[]> {
  const { data, error } = await supabase
    .from('character_usage_stats')
    .select('*')
    .order('times_placed', { ascending: false });

  if (error) throw error;
  return (data ?? []) as CharacterUsageStats[];
}

function Bar({ value, max, color }: { value: number; max: number; color?: string | null }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-sm bg-surface-raised">
      <div
        className="h-full transition-all"
        style={{ width: `${pct}%`, backgroundColor: color ?? 'rgb(var(--color-primary))' }}
      />
    </div>
  );
}

export function AdminReportsPage() {
  const players = useQuery({ queryKey: ['admin', 'reports', 'players'], queryFn: fetchPlayerStats });
  const characters = useQuery({
    queryKey: ['admin', 'reports', 'characters'],
    queryFn: fetchCharacterStats,
  });

  if (players.isLoading || characters.isLoading) return <Spinner />;

  const playerRows = players.data ?? [];
  const charRows = (characters.data ?? []).filter((c) => c.times_placed > 0);
  const maxUsage = charRows[0]?.times_placed ?? 0;

  const totals = {
    jugadores: playerRows.length,
    participaciones: playerRows.reduce((sum, p) => sum + p.tournaments_played, 0),
    personajes: charRows.length,
  };

  return (
    <>
      <AdminHeader
        title="REPORTES"
        description="Todo se calcula a partir de los resultados capturados. No hay nada que actualizar a mano."
      />

      {playerRows.length === 0 ? (
        <EmptyState
          title="Aún no hay datos"
          message="Las estadísticas aparecen en cuanto captures los resultados del primer torneo."
        />
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <ArcadePanel beveled={false} className="p-5">
              <div className="font-display text-xl text-primary">{totals.jugadores}</div>
              <div className="mt-2 text-xs uppercase tracking-wide text-ink-dim">
                Jugadores con resultados
              </div>
            </ArcadePanel>
            <ArcadePanel beveled={false} className="p-5">
              <div className="font-display text-xl text-primary">{totals.participaciones}</div>
              <div className="mt-2 text-xs uppercase tracking-wide text-ink-dim">
                Participaciones
              </div>
            </ArcadePanel>
            <ArcadePanel beveled={false} className="p-5">
              <div className="font-display text-xl text-primary">{totals.personajes}</div>
              <div className="mt-2 text-xs uppercase tracking-wide text-ink-dim">
                Personajes usados
              </div>
            </ArcadePanel>
          </div>

          {/* Ranking de jugadores */}
          <section>
            <h2 className="mb-3 font-display text-[10px] uppercase tracking-wide text-steel">
              Ranking de jugadores
            </h2>
            <ArcadePanel beveled={false} className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-edge text-xs uppercase tracking-wide text-ink-dim">
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Jugador</th>
                    <th className="px-4 py-3 text-right">Torneos</th>
                    <th className="px-4 py-3 text-right">🥇</th>
                    <th className="px-4 py-3 text-right">🥈</th>
                    <th className="px-4 py-3 text-right">🥉</th>
                    <th className="px-4 py-3 text-right">Media</th>
                    <th className="px-4 py-3 text-right">Último</th>
                  </tr>
                </thead>
                <tbody>
                  {playerRows.map((player, index) => (
                    <tr
                      key={player.player_id}
                      className="border-b border-edge/50 last:border-0 hover:bg-surface-raised/50"
                    >
                      <td className="px-4 py-3 font-display text-[10px] text-ink-dim">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={routes.playerDetail(player.nickname)}
                          className="font-medium text-ink hover:text-primary"
                        >
                          {player.nickname}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right text-ink-soft">
                        {player.tournaments_played}
                      </td>
                      <td className="px-4 py-3 text-right text-primary">
                        {player.first_places || '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-ink-soft">
                        {player.second_places || '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-ink-soft">
                        {player.third_places || '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-ink-dim">
                        {player.average_position ?? '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-ink-dim">
                        {player.last_tournament_at
                          ? formatDate(player.last_tournament_at)
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ArcadePanel>
            <p className="mt-2 text-xs text-ink-dim">
              Ordenado por campeonatos, luego podios, luego posición media. Los invitados
              sin cuenta no aparecen aquí: sus resultados sí están en el historial del
              torneo, pero no se acumulan en un perfil.
            </p>
          </section>

          {/* Uso de personajes */}
          <section>
            <h2 className="mb-3 font-display text-[10px] uppercase tracking-wide text-steel">
              Personajes en el podio
            </h2>

            {charRows.length === 0 ? (
              <ArcadePanel beveled={false} className="p-6">
                <p className="text-sm text-ink-dim">
                  Todavía no se ha registrado el personaje en ningún resultado. Al capturar
                  torneos, elige el personaje de cada jugador para que estas cifras
                  existan.
                </p>
              </ArcadePanel>
            ) : (
              <ArcadePanel beveled={false} className="divide-y divide-edge">
                {charRows.map((character) => (
                  <div key={character.character_id} className="p-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 shrink-0 rounded-sm"
                          style={{ backgroundColor: character.color_hex }}
                          aria-hidden
                        />
                        <span className="font-medium text-ink">
                          {character.character_name}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Badge tone="primary">{character.wins} victorias</Badge>
                        <Badge>{character.podiums} podios</Badge>
                        <span className="text-ink-dim">
                          {character.players_using_as_main} lo usan de main
                        </span>
                      </div>
                    </div>
                    <Bar
                      value={character.times_placed}
                      max={maxUsage}
                      color={character.color_hex}
                    />
                  </div>
                ))}
              </ArcadePanel>
            )}

            <p className="mt-2 text-xs text-ink-dim">
              La barra mide cuántas veces apareció ese personaje en un resultado. Se toma
              del personaje registrado en cada torneo, no del main actual del perfil: por
              eso refleja lo que de verdad se jugó.
            </p>
          </section>
        </div>
      )}
    </>
  );
}
