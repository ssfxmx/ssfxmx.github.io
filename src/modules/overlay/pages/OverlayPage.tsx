import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useCharacters } from '@/shared/hooks';
import {
  getStreamState,
  subscribeToStreamState,
  type StreamState,
} from '../services/overlay.service';

/**
 * Overlay para OBS.
 *
 * Se captura como "fuente de navegador". Tres cosas que no son obvias y que
 * hacen la diferencia entre funcionar y no:
 *
 * 1. FONDO TRANSPARENTE. Se añade una clase al body porque el fondo navy del
 *    sitio taparía el juego entero. También hay que apagar la rejilla y las
 *    scanlines, que en OBS se verían encima de la partida.
 *
 * 2. REALTIME. El marcador cambia solo, sin recargar. Preguntar cada pocos
 *    segundos se vería como un salto con retraso justo cuando más se nota.
 *
 * 3. NADA DE ANIMACIONES DE ENTRADA. Un overlay que aparece con transiciones
 *    queda mal al grabar. Los cambios son inmediatos a propósito.
 *
 * La URL admite `?debug=1` para ver la conexión y comprobar que llega la señal
 * antes de salir en vivo.
 */
export function OverlayPage() {
  const { key } = useParams<{ key: string }>();
  const [params] = useSearchParams();
  const debug = params.get('debug') === '1';

  const [state, setState] = useState<StreamState | null>(null);
  const [connected, setConnected] = useState(false);
  const { data: characters } = useCharacters();

  // Fondo transparente y sin efectos del sitio mientras dure el overlay.
  useEffect(() => {
    document.body.classList.add('overlay-mode');
    return () => document.body.classList.remove('overlay-mode');
  }, []);

  useEffect(() => {
    let active = true;

    getStreamState().then((initial) => {
      if (active) {
        setState(initial);
        setConnected(true);
      }
    });

    const unsubscribe = subscribeToStreamState((next) => {
      if (active) setState(next);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const characterName = (id: number | null) =>
    characters?.find((character) => character.id === id)?.name ?? null;

  const characterColor = (id: number | null) =>
    characters?.find((character) => character.id === id)?.color_hex ?? '#F5C63F';

  if (!state) {
    return (
      <div className="p-4 font-sans text-sm text-white/70">
        {debug ? 'Conectando con el marcador…' : null}
      </div>
    );
  }

  // El marcador se oculta cuando no hay transmisión activa, en lugar de mostrar
  // nombres viejos: es preferible un hueco vacío a información equivocada.
  if (!state.is_live && !debug) return null;

  const wins = Math.ceil(state.best_of / 2);

  return (
    <div className="flex min-h-screen items-start justify-center p-6 font-sans">
      <div className="w-full max-w-4xl">
        {(state.tournament_label || state.round_label) && (
          <div className="mb-2 flex items-center justify-center gap-3">
            {state.tournament_label && (
              <span className="rounded-sm bg-black/80 px-3 py-1 font-display text-[10px] uppercase tracking-wider text-[#F5C63F]">
                {state.tournament_label}
              </span>
            )}
            {state.round_label && (
              <span className="rounded-sm bg-black/80 px-3 py-1 text-xs uppercase tracking-wider text-white/80">
                {state.round_label}
              </span>
            )}
          </div>
        )}

        <div className="flex items-stretch overflow-hidden rounded-sm border-2 border-black bg-black/85 shadow-lg">
          <PlayerSide
            name={state.player1_label ?? 'Jugador 1'}
            score={state.player1_score}
            wins={wins}
            character={state.show_characters ? characterName(state.player1_char_id) : null}
            color={characterColor(state.player1_char_id)}
          />

          <div className="flex w-16 shrink-0 items-center justify-center bg-gradient-to-b from-[#F5C63F] to-[#F26522]">
            <span className="font-display text-xs text-black">VS</span>
          </div>

          <PlayerSide
            name={state.player2_label ?? 'Jugador 2'}
            score={state.player2_score}
            wins={wins}
            character={state.show_characters ? characterName(state.player2_char_id) : null}
            color={characterColor(state.player2_char_id)}
            mirrored
          />
        </div>

        {debug && (
          <div className="mt-4 rounded bg-black/80 p-3 font-mono text-xs text-white/70">
            <p>overlay: {key}</p>
            <p>conexión: {connected ? 'establecida' : 'esperando'}</p>
            <p>en vivo: {state.is_live ? 'sí' : 'no (oculto en OBS)'}</p>
            <p>actualizado: {new Date(state.updated_at).toLocaleTimeString('es-MX')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PlayerSide({
  name,
  score,
  wins,
  character,
  color,
  mirrored = false,
}: {
  name: string;
  score: number;
  wins: number;
  character: string | null;
  color: string;
  mirrored?: boolean;
}) {
  const dots = Array.from({ length: wins }, (_, index) => index < score);

  return (
    <div
      className={[
        'flex flex-1 items-center gap-4 px-5 py-3',
        mirrored ? 'flex-row-reverse text-right' : '',
      ].join(' ')}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-xl font-semibold leading-tight text-white">{name}</p>
        {character && (
          <p className="truncate text-xs uppercase tracking-wider" style={{ color }}>
            {character}
          </p>
        )}
      </div>

      <div className={['flex items-center gap-3', mirrored ? 'flex-row-reverse' : ''].join(' ')}>
        {/* Indicadores de rondas ganadas: se leen de un vistazo, que es lo que
            hace falta cuando el marcador ocupa una esquina de la pantalla. */}
        <div className={['flex gap-1', mirrored ? 'flex-row-reverse' : ''].join(' ')}>
          {dots.map((won, index) => (
            <span
              key={index}
              className="h-2.5 w-2.5 rounded-full border"
              style={{
                backgroundColor: won ? color : 'transparent',
                borderColor: color,
              }}
            />
          ))}
        </div>

        <span
          className="min-w-[2ch] text-center font-display text-2xl leading-none"
          style={{ color }}
        >
          {score}
        </span>
      </div>
    </div>
  );
}
