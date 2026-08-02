import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftRight, Check, Copy, ExternalLink, Minus, Plus, RotateCcw } from 'lucide-react';
import { friendlyError } from '@/shared/lib/supabase';
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
import { usePlayers } from '@/modules/players/hooks';
import { useAdminEvents } from '@/modules/events/hooks';
import {
  getStreamState,
  listOverlays,
  updateStreamState,
  type StreamState,
} from '@/modules/overlay/services/overlay.service';
import { AdminHeader } from '../shared/AdminKit';

/**
 * Control del marcador en vivo.
 *
 * Se diseñó para usarse CON UNA MANO Y SIN MIRAR, mientras se transmite. De ahí
 * las decisiones:
 *
 *   - Los botones de puntuación son enormes y están separados: durante un
 *     torneo se aprietan a ciegas y con prisa.
 *   - Cada cambio se guarda al instante, sin botón de guardar. Un marcador que
 *     hay que confirmar es un marcador desactualizado.
 *   - "Intercambiar lados" existe porque los jugadores cambian de lado entre
 *     rondas y reescribir los dos nombres a media transmisión es la vía rápida
 *     a equivocarse.
 *   - El interruptor de "en vivo" oculta el overlay en OBS sin tener que quitar
 *     la fuente. Entre combates queda limpio.
 */
export function AdminOverlaysPage() {
  const queryClient = useQueryClient();
  const { data: characters } = useCharacters();
  const { data: events } = useAdminEvents();
  const { data: overlays } = useQuery({ queryKey: ['overlays'], queryFn: listOverlays });

  const { data: state, isLoading } = useQuery({
    queryKey: ['stream_state'],
    queryFn: getStreamState,
  });

  const [local, setLocal] = useState<StreamState | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (state) setLocal(state);
  }, [state]);

  const save = useMutation({
    mutationFn: (input: Partial<StreamState>) => updateStreamState(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stream_state'] }),
    onError: (err) => setError(friendlyError(err)),
  });

  /** Actualiza en pantalla al instante y manda el cambio en paralelo. */
  function patch(input: Partial<StreamState>) {
    setLocal((prev) => (prev ? { ...prev, ...input } : prev));
    setError('');
    save.mutate(input);
  }

  if (isLoading || !local) return <Spinner />;

  const overlayUrl = `${import.meta.env.VITE_SITE_URL ?? window.location.origin}/overlay/${
    overlays?.[0]?.key ?? 'marcador'
  }`;

  async function copyUrl() {
    await navigator.clipboard.writeText(overlayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <AdminHeader
        title="OVERLAYS OBS"
        description="El marcador cambia en OBS al instante, sin recargar la fuente."
      />

      {error && <Alert tone="danger">{error}</Alert>}

      {/* Dirección para OBS */}
      <ArcadePanel beveled={false} className="mb-6 p-5">
        <h2 className="mb-3 font-display text-[10px] uppercase tracking-wide text-primary">
          Dirección para OBS
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          <code className="min-w-0 flex-1 truncate rounded border border-edge bg-base px-3 py-2 text-sm text-steel">
            {overlayUrl}
          </code>
          <Button size="sm" variant="secondary" onClick={copyUrl}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? 'Copiado' : 'Copiar'}
          </Button>
          <a
            href={`${overlayUrl}?debug=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-steel hover:text-primary"
          >
            Probar <ExternalLink size={14} />
          </a>
        </div>

        <div className="mt-4 space-y-1 text-xs leading-relaxed text-ink-dim">
          <p>
            En OBS: <strong className="text-ink-soft">Fuentes → + → Navegador</strong>, pega
            la dirección y pon 1920 × 300 de tamaño.
          </p>
          <p>
            Deja marcado <strong className="text-ink-soft">
              «Apagar la fuente cuando no esté visible»
            </strong>{' '}
            para que no consuma recursos entre escenas.
          </p>
          <p>
            El enlace de «Probar» añade un panel de diagnóstico. No lo uses en la
            transmisión.
          </p>
        </div>
      </ArcadePanel>

      {/* Interruptor de emisión */}
      <ArcadePanel
        className={[
          'mb-6 p-5 transition-colors',
          local.is_live ? 'border-magenta' : '',
        ].join(' ')}
      >
        <label className="flex cursor-pointer items-center justify-between gap-4">
          <div>
            <p className="font-medium text-ink">
              {local.is_live ? '🔴 Marcador visible en OBS' : 'Marcador oculto'}
            </p>
            <p className="mt-1 text-xs text-ink-dim">
              Al apagarlo, el overlay desaparece de la transmisión sin tocar OBS. Úsalo
              entre combates.
            </p>
          </div>
          <input
            type="checkbox"
            checked={local.is_live}
            onChange={(e) => patch({ is_live: e.target.checked })}
            className="h-6 w-6 shrink-0 accent-[rgb(var(--color-magenta))]"
          />
        </label>
      </ArcadePanel>

      {/* Marcador */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <PlayerPanel
          title="Jugador 1"
          name={local.player1_label ?? ''}
          score={local.player1_score}
          characterId={local.player1_char_id}
          characters={characters ?? []}
          onName={(value) => patch({ player1_label: value })}
          onScore={(value) => patch({ player1_score: value })}
          onCharacter={(value) => patch({ player1_char_id: value })}
        />
        <PlayerPanel
          title="Jugador 2"
          name={local.player2_label ?? ''}
          score={local.player2_score}
          characterId={local.player2_char_id}
          characters={characters ?? []}
          onName={(value) => patch({ player2_label: value })}
          onScore={(value) => patch({ player2_score: value })}
          onCharacter={(value) => patch({ player2_char_id: value })}
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Button
          variant="secondary"
          onClick={() =>
            patch({
              player1_label: local.player2_label,
              player1_score: local.player2_score,
              player1_char_id: local.player2_char_id,
              player2_label: local.player1_label,
              player2_score: local.player1_score,
              player2_char_id: local.player1_char_id,
            })
          }
        >
          <ArrowLeftRight size={15} /> Intercambiar lados
        </Button>

        <Button
          variant="secondary"
          onClick={() => patch({ player1_score: 0, player2_score: 0 })}
        >
          <RotateCcw size={15} /> Reiniciar marcador
        </Button>

        <Button
          variant="ghost"
          onClick={() =>
            patch({
              player1_label: '',
              player2_label: '',
              player1_score: 0,
              player2_score: 0,
              player1_char_id: null,
              player2_char_id: null,
              round_label: '',
            })
          }
        >
          Limpiar todo
        </Button>
      </div>

      {/* Contexto del combate */}
      <ArcadePanel beveled={false} className="space-y-4 p-5">
        <h2 className="font-display text-[10px] uppercase tracking-wide text-primary">
          Contexto del combate
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Torneo" hint="Texto superior del marcador.">
            <Input
              value={local.tournament_label ?? ''}
              onChange={(e) => patch({ tournament_label: e.target.value })}
              placeholder="Rey de la Farmacia #3"
              list="eventos-sugeridos"
            />
            <datalist id="eventos-sugeridos">
              {events?.slice(0, 10).map((event) => (
                <option key={event.id} value={event.name} />
              ))}
            </datalist>
          </Field>

          <Field label="Ronda">
            <Input
              value={local.round_label ?? ''}
              onChange={(e) => patch({ round_label: e.target.value })}
              placeholder="Semifinal, Winners, Grand Final…"
            />
          </Field>

          <Field label="Formato" hint="Dibuja los indicadores de rondas ganadas.">
            <Select
              value={local.best_of}
              onChange={(e) => patch({ best_of: Number(e.target.value) })}
            >
              <option value={1}>Una partida</option>
              <option value={3}>Al mejor de 3</option>
              <option value={5}>Al mejor de 5</option>
              <option value={7}>Al mejor de 7</option>
            </Select>
          </Field>

          <div className="flex items-end">
            <label className="flex cursor-pointer items-center gap-3 pb-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={local.show_characters}
                onChange={(e) => patch({ show_characters: e.target.checked })}
                className="h-4 w-4 accent-[rgb(var(--color-primary))]"
              />
              Mostrar personajes
            </label>
          </div>
        </div>
      </ArcadePanel>
    </>
  );
}

/**
 * Panel de un jugador.
 *
 * El buscador propone jugadores registrados, pero el campo admite cualquier
 * texto: en una transmisión aparece gente sin cuenta y detener todo para
 * registrarla no es opción.
 */
function PlayerPanel({
  title,
  name,
  score,
  characterId,
  characters,
  onName,
  onScore,
  onCharacter,
}: {
  title: string;
  name: string;
  score: number;
  characterId: number | null;
  characters: Array<{ id: number; name: string }>;
  onName: (value: string) => void;
  onScore: (value: number) => void;
  onCharacter: (value: number | null) => void;
}) {
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 250);
  const { data: suggestions } = usePlayers({ search: debounced });

  return (
    <ArcadePanel beveled={false} className="space-y-4 p-5">
      <h2 className="font-display text-[10px] uppercase tracking-wide text-steel">
        {title}
      </h2>

      <Field label="Nombre">
        <Input
          value={name}
          onChange={(e) => {
            onName(e.target.value);
            setQuery(e.target.value);
          }}
          placeholder="Nickname"
        />
      </Field>

      {query.length >= 2 && (suggestions?.length ?? 0) > 0 && (
        <div className="max-h-32 overflow-y-auto rounded border border-edge bg-base">
          {suggestions?.slice(0, 5).map((player) => (
            <button
              key={player.id}
              type="button"
              onClick={() => {
                onName(player.nickname);
                if (player.character_id) onCharacter(player.character_id);
                setQuery('');
              }}
              className="block w-full px-3 py-2 text-left text-sm text-ink-soft hover:bg-surface-raised hover:text-primary"
            >
              {player.nickname}
              {player.character_name && (
                <span className="ml-2 text-xs text-ink-dim">{player.character_name}</span>
              )}
            </button>
          ))}
        </div>
      )}

      <Field label="Personaje">
        <Select
          value={characterId ?? ''}
          onChange={(e) => onCharacter(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">Sin especificar</option>
          {characters.map((character) => (
            <option key={character.id} value={character.id}>
              {character.name}
            </option>
          ))}
        </Select>
      </Field>

      {/* Botones grandes: se aprietan a ciegas durante la transmisión. */}
      <div>
        <p className="mb-2 text-sm font-medium text-ink-soft">Puntuación</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onScore(Math.max(0, score - 1))}
            className="flex h-16 flex-1 items-center justify-center rounded border border-edge bg-surface-raised text-ink-soft transition-colors hover:border-danger hover:text-danger"
            aria-label="Restar un punto"
          >
            <Minus size={24} />
          </button>

          <span className="w-16 text-center font-display text-3xl text-primary">
            {score}
          </span>

          <button
            onClick={() => onScore(score + 1)}
            className="flex h-16 flex-1 items-center justify-center rounded border border-primary/40 bg-primary/15 text-primary transition-colors hover:bg-primary/25"
            aria-label="Sumar un punto"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>
    </ArcadePanel>
  );
}
