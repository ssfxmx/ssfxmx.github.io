import { supabase } from '@/shared/lib/supabase';
import type { CharacterUsageStats, PlayerStats } from '@/shared/types/database';

/**
 * Estadísticas.
 *
 * Todo sale de vistas creadas en la primera migración: player_stats y
 * character_usage_stats. Nada se recalcula ni se guarda por separado, así que
 * las cifras nunca pueden quedar desfasadas respecto a los resultados.
 *
 * Las vistas son públicas (RLS permite lectura anónima), por eso la misma
 * consulta sirve para la página abierta y para el panel.
 */

export async function fetchPlayerRanking(): Promise<PlayerStats[]> {
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

export async function fetchCharacterUsage(): Promise<CharacterUsageStats[]> {
  const { data, error } = await supabase
    .from('character_usage_stats')
    .select('*')
    .order('times_placed', { ascending: false });

  if (error) throw error;
  return (data ?? []) as CharacterUsageStats[];
}

/** Número de torneos con resultados. Da contexto a la fiabilidad del ranking. */
export async function fetchTournamentCount(): Promise<number> {
  const { count, error } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'finished')
    .eq('kind', 'tournament');

  if (error) throw error;
  return count ?? 0;
}
