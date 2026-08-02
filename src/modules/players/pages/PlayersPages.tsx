import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Search, Trophy } from 'lucide-react';
import { routes } from '@/shared/constants/routes';
import { resolveAvatar } from '@/shared/utils/avatar';
import { countryFlag, countryName, pluralize } from '@/shared/utils/format';
import { formatDate } from '@/shared/utils/date';
import { useCharacters, useDebounce } from '@/shared/hooks';
import { PageMeta } from '@/shared/components/seo/PageMeta';
import {
  ArcadePanel,
  Avatar,
  Badge,
  EmptyState,
  ErrorState,
  Field,
  Input,
  SectionTitle,
  Select,
  Spinner,
} from '@/shared/components/ui';
import { usePlayerHistory } from '@/modules/results/hooks';
import type { PlayerPublic } from '@/shared/types/database';
import { useCities, usePlayerDetail, usePlayerStats, usePlayers } from '../hooks';

/* ========================================================================== */
/* Directorio                                                                  */
/* ========================================================================== */

function PlayerCard({ player }: { player: PlayerPublic }) {
  const avatar = resolveAvatar(player);

  return (
    <Link to={routes.playerDetail(player.nickname)} className="group block">
      <ArcadePanel className="flex h-full items-center gap-4 p-4 transition-colors group-hover:border-primary/60">
        <Avatar src={avatar} alt="" size={56} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-ink group-hover:text-primary">
            {player.nickname}
          </p>
          {player.city && (
            <p className="flex items-center gap-1 truncate text-xs text-ink-dim">
              <MapPin size={11} /> {player.city}
              <span aria-hidden>{countryFlag(player.country_code)}</span>
            </p>
          )}
          {player.character_name && (
            <span className="mt-1.5 inline-block text-xs text-cyan">
              {player.character_name}
            </span>
          )}
        </div>
      </ArcadePanel>
    </Link>
  );
}

export function PlayersListPage() {
  const [search, setSearch] = useState('');
  const [characterId, setCharacterId] = useState<number | null>(null);
  const [city, setCity] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 350);
  const { data: characters } = useCharacters();
  const { data: cities } = useCities();

  const { data, isLoading, isError, refetch } = usePlayers({
    search: debouncedSearch,
    characterId,
    city,
  });

  return (
    <>
      <PageMeta
        title="Jugadores"
        description="Directorio de jugadores de la comunidad SSF2X México."
      />

      <SectionTitle>JUGADORES</SectionTitle>

      <ArcadePanel beveled={false} className="mb-8 p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Buscar">
            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nickname…"
                className="pl-9"
              />
            </div>
          </Field>

          <Field label="Personaje">
            <Select
              value={characterId ?? ''}
              onChange={(e) => setCharacterId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Todos</option>
              {characters?.map((character) => (
                <option key={character.id} value={character.id}>
                  {character.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Ciudad">
            <Select value={city ?? ''} onChange={(e) => setCity(e.target.value || null)}>
              <option value="">Todas</option>
              {cities?.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </ArcadePanel>

      {isLoading && <Spinner />}
      {isError && <ErrorState onRetry={() => refetch()} />}

      {data && data.length === 0 && (
        <EmptyState
          title="Sin resultados"
          message="Prueba con otro nickname o quita los filtros."
        />
      )}

      {data && data.length > 0 && (
        <>
          <p className="mb-4 text-sm text-ink-dim">{pluralize(data.length, 'jugador', 'jugadores')}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

/* ========================================================================== */
/* Perfil público                                                              */
/* ========================================================================== */

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-edge bg-surface p-4 text-center">
      <div className="font-display text-lg text-primary">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-wide text-ink-dim">{label}</div>
    </div>
  );
}

/**
 * Perfil público de un jugador.
 *
 * Muestra únicamente lo que devuelve la vista players_public. El correo, el
 * nombre real y la fecha de nacimiento no aparecen aquí porque ni siquiera
 * llegan al navegador: viven en una tabla que esta consulta no toca.
 */
export function PlayerProfilePage() {
  const { nickname } = useParams<{ nickname: string }>();
  const { data: player, isLoading, isError, refetch } = usePlayerDetail(nickname);
  const { data: stats } = usePlayerStats(player?.id);
  const { data: history } = usePlayerHistory(player?.id);

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (!player) {
    return (
      <EmptyState
        title="Jugador no encontrado"
        message="Puede que haya cambiado de nickname o que la cuenta ya no esté activa."
      />
    );
  }

  const avatar = resolveAvatar(player);

  return (
    <div className="mx-auto max-w-3xl">
      <PageMeta
        title={player.nickname}
        description={`Perfil de ${player.nickname} en la comunidad SSF2X México.${
          player.character_name ? ` Main: ${player.character_name}.` : ''
        }`}
      />

      <Link
        to={routes.players}
        className="mb-6 inline-flex items-center gap-2 text-sm text-ink-soft hover:text-primary"
      >
        <ArrowLeft size={16} /> Volver al directorio
      </Link>

      <ArcadePanel glow className="mb-8 p-6">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <Avatar src={avatar} alt="" size={96} ring />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="font-display text-base text-primary neon-text">
                {player.nickname}
              </h1>
              {player.role === 'admin' && <Badge tone="magenta">Staff</Badge>}
            </div>

            <p className="mt-2 flex flex-wrap items-center justify-center gap-2 text-sm text-ink-soft sm:justify-start">
              {player.city && (
                <span className="flex items-center gap-1">
                  <MapPin size={13} /> {player.city}
                </span>
              )}
              <span>
                {countryFlag(player.country_code)} {countryName(player.country_code)}
              </span>
            </p>

            {player.character_name && (
              <p className="mt-2 text-sm">
                <span className="text-ink-dim">Main: </span>
                <span className="text-cyan">{player.character_name}</span>
              </p>
            )}

            {player.bio && <p className="mt-3 text-sm text-ink-soft">{player.bio}</p>}

            <p className="mt-3 text-xs text-ink-dim">
              En la comunidad desde {formatDate(player.created_at)}
            </p>
          </div>
        </div>
      </ArcadePanel>

      {stats && stats.tournaments_played > 0 ? (
        <>
          <SectionTitle>ESTADÍSTICAS</SectionTitle>
          <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatBox label="Torneos" value={stats.tournaments_played} />
            <StatBox label="Campeonatos" value={stats.first_places} />
            <StatBox label="Podios" value={stats.podiums} />
            <StatBox label="Mejor puesto" value={stats.best_position ?? '—'} />
          </div>
        </>
      ) : (
        <ArcadePanel className="mb-10 p-6 text-center">
          <Trophy size={24} className="mx-auto mb-2 text-ink-dim" />
          <p className="text-sm text-ink-soft">
            Todavía no ha participado en ningún torneo registrado.
          </p>
        </ArcadePanel>
      )}

      {history && history.length > 0 && (
        <>
          <SectionTitle>HISTORIAL DE TORNEOS</SectionTitle>
          <div className="space-y-3">
            {history.map((entry) => (
              <Link key={entry.id} to={routes.resultDetail(entry.event_slug)} className="block">
                <ArcadePanel
                  beveled={false}
                  className="flex flex-wrap items-center gap-4 p-4 hover:border-primary/60"
                >
                  <span className="w-10 shrink-0 text-center font-display text-sm text-primary">
                    {entry.position}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{entry.event_name}</p>
                    <p className="text-xs text-ink-dim">{formatDate(entry.event_date)}</p>
                  </div>
                  {entry.character_name && <Badge tone="cyan">{entry.character_name}</Badge>}
                </ArcadePanel>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
