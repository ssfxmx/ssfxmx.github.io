import { supabase } from '@/shared/lib/supabase';
import type { EventResult, EventResultPublic } from '@/shared/types/database';

/**
 * Resultados de torneo.
 *
 * Las lecturas públicas usan la vista event_results_public, que resuelve los
 * joins con jugadores y personajes en la base de datos. Una petición en lugar
 * de tres, y la lógica de "jugador registrado o invitado" en un solo sitio.
 */

/** Todos los resultados de eventos finalizados, ordenados por fecha. */
export async function listAllResults(): Promise<EventResultPublic[]> {
  const { data, error } = await supabase
    .from('event_results_public')
    .select('*')
    .order('event_date', { ascending: false })
    .order('position', { ascending: true });

  if (error) throw error;
  return (data ?? []) as EventResultPublic[];
}

export async function listResultsByEventSlug(slug: string): Promise<EventResultPublic[]> {
  const { data, error } = await supabase
    .from('event_results_public')
    .select('*')
    .eq('event_slug', slug)
    .order('position');

  if (error) throw error;
  return (data ?? []) as EventResultPublic[];
}

/** Historial de un jugador: en qué torneos participó y en qué puesto quedó. */
export async function listResultsByPlayer(playerId: string): Promise<EventResultPublic[]> {
  const { data, error } = await supabase
    .from('event_results_public')
    .select('*')
    .eq('player_id', playerId)
    .order('event_date', { ascending: false });

  if (error) throw error;
  return (data ?? []) as EventResultPublic[];
}

export async function listRecentResults(limit = 8): Promise<EventResultPublic[]> {
  const { data, error } = await supabase
    .from('event_results_public')
    .select('*')
    .lte('position', 3)
    .order('event_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as EventResultPublic[];
}

/* ------------------------------ Administración ---------------------------- */

export async function listRawResultsByEvent(eventId: string): Promise<EventResult[]> {
  const { data, error } = await supabase
    .from('event_results')
    .select('*')
    .eq('event_id', eventId)
    .order('position');

  if (error) throw error;
  return (data ?? []) as EventResult[];
}

export interface ResultRowInput {
  position: number;
  player_id: string | null;
  guest_nickname: string | null;
  character_id: number | null;
  notes: string | null;
}

/**
 * Guarda el podio completo de un evento.
 *
 * Se borra y se vuelve a insertar en lugar de calcular diferencias fila por
 * fila. Con cuatro u ocho posiciones la diferencia de rendimiento es nula, y a
 * cambio se elimina toda una categoría de errores: posiciones duplicadas al
 * reordenar, filas huérfanas, estados intermedios inválidos.
 *
 * Las restricciones UNIQUE de la tabla siguen protegiendo la integridad si algo
 * llegara mal desde la interfaz.
 */
export async function replaceEventResults(eventId: string, rows: ResultRowInput[]) {
  const { error: deleteError } = await supabase
    .from('event_results')
    .delete()
    .eq('event_id', eventId);

  if (deleteError) throw deleteError;

  if (rows.length === 0) return;

  const payload = rows.map((row) => ({
    event_id: eventId,
    position: row.position,
    player_id: row.player_id,
    // Si el jugador está registrado no se guarda nickname de invitado: el dato
    // duplicado se desincronizaría en cuanto alguien cambiara su nickname.
    guest_nickname: row.player_id ? null : row.guest_nickname,
    character_id: row.character_id,
    notes: row.notes,
  }));

  const { error } = await supabase.from('event_results').insert(payload);
  if (error) throw error;
}
