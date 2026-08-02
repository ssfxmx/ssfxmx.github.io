import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { routes } from '@/shared/constants/routes';
import { friendlyError } from '@/shared/lib/supabase';
import { formatDate } from '@/shared/utils/date';
import { positionLabel } from '@/shared/utils/format';
import { useCharacters, useDebounce } from '@/shared/hooks';
import {
  Alert,
  ArcadePanel,
  Button,
  Field,
  Input,
  Select,
  Spinner,
} from '@/shared/components/ui';
import { useAdminEvent, useFinishedEvents } from '@/modules/events/hooks';
import { useRawResults, useSaveResults } from '@/modules/results/hooks';
import { usePlayers } from '@/modules/players/hooks';
import { AdminHeader } from '../shared/AdminKit';

/* ========================================================================== */
/* Selección de torneo                                                         */
/* ========================================================================== */

export function AdminResultsList() {
  const { data, isLoading } = useFinishedEvents();

  if (isLoading) return <Spinner />;

  return (
    <>
      <AdminHeader
        title="RESULTADOS"
        description="Elige un torneo finalizado para capturar sus posiciones."
      />

      {(!data || data.length === 0) && (
        <ArcadePanel className="p-8 text-center">
          <p className="text-sm text-ink-soft">
            No hay torneos finalizados. Solo se pueden registrar resultados en eventos con
            estado <strong className="text-primary">Finalizado</strong>.
          </p>
          <Link to={routes.adminEvents} className="mt-4 inline-block text-sm text-cyan hover:text-primary">
            Ir a eventos →
          </Link>
        </ArcadePanel>
      )}

      <div className="space-y-3">
        {data?.map((event) => (
          <Link key={event.id} to={routes.adminResultsEdit(event.id)}>
            <ArcadePanel
              beveled={false}
              className="flex items-center justify-between gap-4 p-4 hover:border-primary/60"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{event.name}</p>
                <p className="text-xs text-ink-dim">{formatDate(event.starts_at)}</p>
              </div>
              <span className="shrink-0 text-sm text-cyan">Capturar →</span>
            </ArcadePanel>
          </Link>
        ))}
      </div>
    </>
  );
}

/* ========================================================================== */
/* Captura                                                                     */
/* ========================================================================== */

interface Row {
  position: number;
  playerId: string | null;
  guestNickname: string;
  characterId: number | null;
  playerQuery: string;
}

function emptyRow(position: number): Row {
  return { position, playerId: null, guestNickname: '', characterId: null, playerQuery: '' };
}

/**
 * Captura de resultados — el flujo que más se usará.
 *
 * Se diseñó para completarse en menos de dos minutos: si capturar resultados es
 * tedioso, se deja de hacer y el sitio muere.
 *
 * Decisiones concretas:
 *   * La posición es automática y correlativa; no se escribe a mano.
 *   * El buscador de jugadores filtra sobre la lista ya cargada, sin ir al
 *     servidor con cada tecla.
 *   * Si el jugador no tiene cuenta, se escribe su nickname como invitado sin
 *     salir del formulario.
 *   * Se valida en vivo que no haya jugadores repetidos.
 *   * Se guarda todo de una vez: o entran todas las posiciones o no entra
 *     ninguna.
 */
export function AdminResultsForm() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const { data: event, isLoading: loadingEvent } = useAdminEvent(eventId);
  const { data: existing, isLoading: loadingResults } = useRawResults(eventId);
  const { data: characters } = useCharacters();
  const save = useSaveResults();

  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 200);
  const { data: players } = usePlayers({ search: debounced });

  useEffect(() => {
    if (!existing) return;

    if (existing.length === 0) {
      setRows([1, 2, 3, 4].map(emptyRow));
      return;
    }

    setRows(
      existing.map((result) => ({
        position: result.position,
        playerId: result.player_id,
        guestNickname: result.guest_nickname ?? '',
        characterId: result.character_id,
        playerQuery: '',
      }))
    );
  }, [existing]);

  const playersById = useMemo(() => {
    const map = new Map<string, string>();
    for (const player of players ?? []) map.set(player.id, player.nickname);
    return map;
  }, [players]);

  if (loadingEvent || loadingResults) return <Spinner />;
  if (!event) return <Alert tone="danger">Evento no encontrado.</Alert>;

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow(prev.length + 1)]);
  }

  function removeRow(index: number) {
    setRows((prev) =>
      prev.filter((_, i) => i !== index).map((row, i) => ({ ...row, position: i + 1 }))
    );
  }

  /** Detecta jugadores repetidos antes de intentar guardar. */
  const duplicates = useMemo(() => {
    const seen = new Set<string>();
    const repeated = new Set<string>();
    for (const row of rows) {
      const key = row.playerId ?? row.guestNickname.trim().toLowerCase();
      if (!key) continue;
      if (seen.has(key)) repeated.add(key);
      seen.add(key);
    }
    return repeated;
  }, [rows]);

  async function handleSave() {
    setError('');
    setSaved(false);

    const filled = rows.filter((row) => row.playerId || row.guestNickname.trim());

    if (filled.length === 0) {
      setError('Agrega al menos una posición.');
      return;
    }
    if (duplicates.size > 0) {
      setError('Hay un jugador repetido en dos posiciones.');
      return;
    }

    try {
      await save.mutateAsync({
        eventId: eventId!,
        rows: filled.map((row) => ({
          position: row.position,
          player_id: row.playerId,
          guest_nickname: row.playerId ? null : row.guestNickname.trim(),
          character_id: row.characterId,
          notes: null,
        })),
      });
      setSaved(true);
      setTimeout(() => navigate(routes.adminResults), 900);
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  return (
    <>
      <AdminHeader
        title="CAPTURAR RESULTADOS"
        description={`${event.name} · ${formatDate(event.starts_at)}`}
      />

      {error && <Alert tone="danger">{error}</Alert>}
      {saved && <Alert tone="success">Resultados guardados.</Alert>}

      <div className="mt-5 space-y-3">
        {rows.map((row, index) => {
          const selectedName = row.playerId ? playersById.get(row.playerId) : null;
          const isDuplicate = duplicates.has(
            row.playerId ?? row.guestNickname.trim().toLowerCase()
          );

          return (
            <ArcadePanel
              key={index}
              beveled={false}
              className={`p-4 ${isDuplicate ? 'border-danger' : ''}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="font-display text-xs text-primary">
                  {positionLabel(row.position).toUpperCase()}
                </span>
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="p-1 text-ink-dim hover:text-danger"
                  aria-label={`Quitar posición ${row.position}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
                <Field label="Jugador">
                  {row.playerId ? (
                    <div className="flex items-center gap-2">
                      <span className="flex-1 rounded border border-cyan/40 bg-cyan/10 px-3 py-2.5 text-sm text-cyan">
                        {selectedName ?? 'Jugador registrado'}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => updateRow(index, { playerId: null, playerQuery: '' })}
                      >
                        Cambiar
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        value={row.playerQuery}
                        onChange={(e) => {
                          updateRow(index, { playerQuery: e.target.value });
                          setSearch(e.target.value);
                        }}
                        placeholder="Buscar jugador registrado…"
                      />

                      {row.playerQuery.length >= 2 && (players?.length ?? 0) > 0 && (
                        <div className="max-h-40 overflow-y-auto rounded border border-edge bg-base">
                          {players?.slice(0, 8).map((player) => (
                            <button
                              key={player.id}
                              type="button"
                              onClick={() =>
                                updateRow(index, {
                                  playerId: player.id,
                                  playerQuery: '',
                                  guestNickname: '',
                                  characterId: row.characterId ?? player.character_id,
                                })
                              }
                              className="block w-full px-3 py-2 text-left text-sm text-ink-soft hover:bg-surface-raised hover:text-primary"
                            >
                              {player.nickname}
                              {player.city && (
                                <span className="ml-2 text-xs text-ink-dim">{player.city}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}

                      <Input
                        value={row.guestNickname}
                        onChange={(e) => updateRow(index, { guestNickname: e.target.value })}
                        placeholder="…o escribe el nickname si no tiene cuenta"
                      />
                    </div>
                  )}
                </Field>

                <Field label="Personaje usado">
                  <Select
                    value={row.characterId ?? ''}
                    onChange={(e) =>
                      updateRow(index, {
                        characterId: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  >
                    <option value="">Sin especificar</option>
                    {characters?.map((character) => (
                      <option key={character.id} value={character.id}>
                        {character.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              {isDuplicate && (
                <p className="mt-2 text-xs text-danger">
                  Este jugador ya aparece en otra posición.
                </p>
              )}
            </ArcadePanel>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button type="button" variant="secondary" size="sm" onClick={addRow}>
          <Plus size={15} /> Agregar posición
        </Button>
      </div>

      <div className="mt-8 flex flex-wrap gap-3 border-t border-edge pt-6">
        <Button onClick={handleSave} loading={save.isPending}>
          Guardar resultados
        </Button>
        <Button variant="ghost" onClick={() => navigate(routes.adminResults)}>
          Cancelar
        </Button>
      </div>

      <p className="mt-4 text-xs text-ink-dim">
        El personaje se guarda por torneo, no se toma del perfil: es el dato que hará
        posibles las estadísticas de personajes más adelante.
      </p>
    </>
  );
}
