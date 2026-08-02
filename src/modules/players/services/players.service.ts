import { supabase } from '@/shared/lib/supabase';
import type { AccountStatus, PlayerPublic, PlayerStats, Profile, UserRole } from '@/shared/types/database';

/**
 * Jugadores.
 *
 * Todas las lecturas públicas van contra la vista players_public, que NO expone
 * correo, nombre real ni fecha de nacimiento. La garantía no depende de que
 * este archivo recuerde omitir campos: esos datos viven en otra tabla
 * (profile_private) que esta vista ni siquiera toca.
 */

export interface PlayerFilters {
  search?: string;
  characterId?: number | null;
  cityId?: number | null;
}

export async function listPlayers(filters: PlayerFilters = {}): Promise<PlayerPublic[]> {
  let query = supabase.from('players_public').select('*').order('nickname');

  if (filters.search?.trim()) {
    query = query.ilike('nickname', `%${filters.search.trim()}%`);
  }
  if (filters.characterId) {
    query = query.eq('character_id', filters.characterId);
  }
  // Se filtra por identificador, no por texto. Antes se comparaban cadenas, y
  // "CDMX" no coincidía con "Ciudad de México" aunque fueran el mismo lugar.
  if (filters.cityId) {
    query = query.eq('city_id', filters.cityId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as PlayerPublic[];
}

export async function getPlayerByNickname(nickname: string): Promise<PlayerPublic | null> {
  const { data, error } = await supabase
    .from('players_public')
    .select('*')
    .ilike('nickname', nickname)
    .maybeSingle();

  if (error) throw error;
  return (data as PlayerPublic) ?? null;
}

export async function getPlayerStats(playerId: string): Promise<PlayerStats | null> {
  const { data, error } = await supabase
    .from('player_stats')
    .select('*')
    .eq('player_id', playerId)
    .maybeSingle();

  if (error) throw error;
  return (data as PlayerStats) ?? null;
}

/** Ranking por podios. Base del futuro módulo de reportes. */
export async function listTopPlayers(limit = 10): Promise<PlayerStats[]> {
  const { data, error } = await supabase
    .from('player_stats')
    .select('*')
    .gt('tournaments_played', 0)
    .order('first_places', { ascending: false })
    .order('podiums', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as PlayerStats[];
}

/* ------------------------------ Administración ---------------------------- */

export async function listProfilesForAdmin(search?: string): Promise<Profile[]> {
  let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (search?.trim()) query = query.ilike('nickname', `%${search.trim()}%`);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function setPlayerStatus(playerId: string, status: AccountStatus) {
  const { error } = await supabase.from('profiles').update({ status }).eq('id', playerId);
  if (error) throw error;
}

export interface AdminPlayerEdit {
  nickname: string;
  city_id: number | null;
  city_custom: string | null;
  country_code: string;
  bio: string | null;
  main_character_id: number | null;
}

/**
 * Edita el perfil de otro jugador.
 *
 * Existe porque un administrador necesita poder corregir un nickname ofensivo,
 * resolver una suplantación o arreglar un dato mal capturado sin pedirle al
 * jugador que lo haga.
 *
 * No incluye el avatar a propósito: las políticas de Storage solo permiten
 * escribir dentro de la carpeta del propio usuario. Un administrador puede
 * BORRAR un avatar inapropiado, pero no subir uno en nombre de otra persona.
 * Es la frontera correcta: moderar sí, suplantar no.
 *
 * El rol y el estado no se tocan aquí; tienen sus propias funciones para que
 * cada acción privilegiada quede registrada por separado en la auditoría.
 */
export async function updatePlayerAsAdmin(playerId: string, input: AdminPlayerEdit) {
  const { error } = await supabase
    .from('profiles')
    .update({
      nickname: input.nickname.trim(),
      city_id: input.city_id,
      city_custom: input.city_id ? null : input.city_custom,
      country_code: input.country_code,
      bio: input.bio,
      main_character_id: input.main_character_id,
    })
    .eq('id', playerId);

  if (error) throw error;
}

/**
 * Cambia el rol de un jugador.
 *
 * Solo funciona si quien la ejecuta es administrador: el trigger
 * protect_profile_privileged_fields revierte el cambio en cualquier otro caso,
 * y prevent_last_admin_removal impide dejar el sitio sin administración.
 */
export async function setPlayerRole(playerId: string, role: UserRole) {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', playerId);
  if (error) throw error;
}
