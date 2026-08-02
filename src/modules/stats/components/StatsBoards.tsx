import { Link } from 'react-router-dom';
import { routes } from '@/shared/constants/routes';
import { formatDate } from '@/shared/utils/date';
import { ArcadePanel, Badge, EmptyState } from '@/shared/components/ui';
import type { CharacterUsageStats, PlayerStats } from '@/shared/types/database';

/**
 * Tableros de estadísticas.
 *
 * Los usan la página pública y la de reportes del panel. Se extrajeron a
 * componentes compartidos en cuanto hubo dos consumidores: mantener dos copias
 * de la misma tabla es cómo empiezan a divergir las cifras que la gente compara.
 */

export function StatsSummary({
  players,
  characters,
}: {
  players: PlayerStats[];
  characters: CharacterUsageStats[];
}) {
  const cards = [
    { label: 'Jugadores con resultados', value: players.length },
    {
      label: 'Participaciones',
      value: players.reduce((sum, player) => sum + player.tournaments_played, 0),
    },
    { label: 'Personajes usados', value: characters.length },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      {cards.map((card) => (
        <ArcadePanel key={card.label} beveled={false} className="p-5">
          <div className="font-display text-xl text-primary">{card.value}</div>
          <div className="mt-2 text-xs uppercase tracking-wide text-ink-dim">
            {card.label}
          </div>
        </ArcadePanel>
      ))}
    </div>
  );
}

export function PlayerRanking({ players }: { players: PlayerStats[] }) {
  if (players.length === 0) {
    return (
      <ArcadePanel beveled={false}>
        <EmptyState
          title="Aún no hay ranking"
          message="Aparecerá en cuanto se registren los resultados del primer torneo."
        />
      </ArcadePanel>
    );
  }

  return (
    <ArcadePanel beveled={false} className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-edge text-xs uppercase tracking-wide text-ink-dim">
            <th className="px-4 py-3 text-left">#</th>
            <th className="px-4 py-3 text-left">Jugador</th>
            <th className="px-4 py-3 text-right">Torneos</th>
            <th className="px-4 py-3 text-right" title="Primeros lugares">🥇</th>
            <th className="px-4 py-3 text-right" title="Segundos lugares">🥈</th>
            <th className="px-4 py-3 text-right" title="Terceros lugares">🥉</th>
            <th className="hidden px-4 py-3 text-right sm:table-cell">Media</th>
            <th className="hidden px-4 py-3 text-right md:table-cell">Último</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, index) => (
            <tr
              key={player.player_id}
              className={[
                'border-b border-edge/50 last:border-0 hover:bg-surface-raised/50',
                index === 0 ? 'bg-primary/5' : '',
              ].join(' ')}
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
              <td className="hidden px-4 py-3 text-right text-ink-dim sm:table-cell">
                {player.average_position ?? '—'}
              </td>
              <td className="hidden whitespace-nowrap px-4 py-3 text-right text-xs text-ink-dim md:table-cell">
                {player.last_tournament_at ? formatDate(player.last_tournament_at) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ArcadePanel>
  );
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

export function CharacterMeta({ characters }: { characters: CharacterUsageStats[] }) {
  const used = characters.filter((character) => character.times_placed > 0);
  const max = used[0]?.times_placed ?? 0;

  if (used.length === 0) {
    return (
      <ArcadePanel beveled={false} className="p-6">
        <p className="text-sm text-ink-dim">
          Todavía no se ha registrado el personaje en ningún resultado. Al capturar los
          torneos, elige el personaje de cada jugador para que estas cifras existan.
        </p>
      </ArcadePanel>
    );
  }

  return (
    <ArcadePanel beveled={false} className="divide-y divide-edge">
      {used.map((character) => (
        <div key={character.character_id} className="p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 shrink-0 rounded-sm"
                style={{ backgroundColor: character.color_hex }}
                aria-hidden
              />
              <span className="font-medium text-ink">{character.character_name}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge tone="primary">{character.wins} victorias</Badge>
              <Badge>{character.podiums} podios</Badge>
              <span className="text-ink-dim">
                {character.players_using_as_main} lo usan de main
              </span>
            </div>
          </div>
          <Bar value={character.times_placed} max={max} color={character.color_hex} />
        </div>
      ))}
    </ArcadePanel>
  );
}
