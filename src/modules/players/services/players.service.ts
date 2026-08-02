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
  city?: string | null;
}

export async function listPlayers(filters: PlayerFilters = {}): Promise<PlayerPublic[]> {
  let query = supabase.from('players_public').select('*').order('nickname');

  if (filters.search?.trim()) {
    query = query.ilike('nickname', `%${filters.search.trim()}%`);
  }
  if (filters.characterId) {
    query = query.eq('character_id', filters.characterId);
  }
  if (filters.city?.trim()) {
    query = query.ilike('city', `%${filters.city.trim()}%`);
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

/** Ciudades presentes, para el filtro del directorio. */
export async function listCities(): Promise<string[]> {
  const { data, error } = await supabase
    .from('players_public')
    .select('city')
    .not('city', 'is', null);

  if (error) throw error;

  const cities = new Set(
    ((data ?? []) as Array<{ city: string | null }>)
      .map((row) => row.city?.trim())
      .filter((city): city is string => Boolean(city))
  );

  return [...cities].sort((a, b) => a.localeCompare(b, 'es'));
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
