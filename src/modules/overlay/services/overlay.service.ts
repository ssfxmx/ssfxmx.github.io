import { supabase } from '@/shared/lib/supabase';

/**
 * Estado del marcador en vivo.
 *
 * Es una tabla de UNA SOLA FILA (id = true). Puede parecer raro, pero refleja la
 * realidad: solo hay una transmisión a la vez. Una tabla con varias filas
 * obligaría a decidir cuál es la buena y abriría la puerta a que el overlay
 * muestre un marcador viejo.
 */

export interface StreamState {
  id: boolean;
  event_id: string | null;
  tournament_label: string | null;
  round_label: string | null;
  player1_label: string | null;
  player1_score: number;
  player1_char_id: number | null;
  player2_label: string | null;
  player2_score: number;
  player2_char_id: number | null;
  best_of: number;
  show_characters: boolean;
  is_live: boolean;
  updated_at: string;
}

export interface Overlay {
  id: string;
  key: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
  is_active: boolean;
}

export async function getStreamState(): Promise<StreamState | null> {
  const { data, error } = await supabase
    .from('stream_state')
    .select('*')
    .eq('id', true)
    .maybeSingle();

  if (error) throw error;
  return (data as StreamState) ?? null;
}

export async function updateStreamState(input: Partial<StreamState>) {
  const { error } = await supabase.from('stream_state').update(input).eq('id', true);
  if (error) throw error;
}

export async function listOverlays(): Promise<Overlay[]> {
  const { data, error } = await supabase.from('overlays').select('*').order('name');
  if (error) throw error;
  return (data ?? []) as Overlay[];
}

/**
 * Escucha los cambios del marcador en tiempo real.
 *
 * Devuelve la función para cancelar la suscripción; el componente la llama al
 * desmontarse. Sin eso, cada recarga del overlay dejaría una conexión abierta y
 * acabarían agotándose las que permite el plan.
 *
 * El primer parámetro llega con la fila completa gracias a REPLICA IDENTITY
 * FULL, configurado en la migración 0015.
 */
export function subscribeToStreamState(onChange: (state: StreamState) => void): () => void {
  const channel = supabase
    .channel('stream_state_changes')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'stream_state' },
      (payload) => onChange(payload.new as StreamState)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
