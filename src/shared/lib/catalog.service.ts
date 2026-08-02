import { supabase } from '@/shared/lib/supabase';
import type {
  Character,
  City,
  PendingCity,
  SiteSetting,
} from '@/shared/types/database';

/* ================================ Ciudades ================================ */

export async function listCities(): Promise<City[]> {
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .eq('is_active', true)
    .order('state')
    .order('name');

  if (error) throw error;
  return (data ?? []) as City[];
}

/** Incluye las desactivadas. Solo para el panel. */
export async function listAllCities(): Promise<City[]> {
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .order('state')
    .order('name');

  if (error) throw error;
  return (data ?? []) as City[];
}

/**
 * Ciudades que la gente escribió a mano y no están en el catálogo.
 * Es lo que permite al administrador mantener la lista al día sin adivinar.
 */
export async function listPendingCities(): Promise<PendingCity[]> {
  const { data, error } = await supabase.from('pending_cities').select('*');
  if (error) throw error;
  return (data ?? []) as PendingCity[];
}

export async function createCity(name: string, state: string): Promise<City> {
  const { data, error } = await supabase
    .from('cities')
    .insert({ name: name.trim(), state: state.trim() })
    .select()
    .single();

  if (error) throw error;
  return data as City;
}

export async function updateCity(id: number, input: Partial<City>) {
  const { error } = await supabase.from('cities').update(input).eq('id', id);
  if (error) throw error;
}

/**
 * Promueve una ciudad escrita a mano al catálogo y reasigna a quienes la
 * habían escrito.
 *
 * Se hace en dos pasos desde el cliente en lugar de una función SQL porque son
 * dos operaciones sencillas y ambas están protegidas por RLS: si quien lo
 * ejecuta no es administrador, las dos fallan. Una función en la base añadiría
 * complejidad sin ganar seguridad.
 */
export async function promoteCity(customName: string, state: string): Promise<City> {
  const city = await createCity(customName, state);

  const { error } = await supabase
    .from('profiles')
    .update({ city_id: city.id, city_custom: null })
    .eq('city_custom', customName);

  if (error) throw error;
  return city;
}

/**
 * Catálogos y configuración del sitio.
 *
 * Se consultan una vez y se cachean mucho tiempo: cambian rarísimamente.
 */

export async function listCharacters(): Promise<Character[]> {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  if (error) throw error;
  return (data ?? []) as Character[];
}

/** Todos los personajes, incluidos los desactivados. Solo para el panel. */
export async function listAllCharacters(): Promise<Character[]> {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .order('display_order');

  if (error) throw error;
  return (data ?? []) as Character[];
}

/**
 * Sube el icono de un personaje al bucket `media`.
 *
 * La ruta es fija por personaje (`characters/{slug}.webp`), así que subir uno
 * nuevo sobrescribe el anterior en lugar de dejar archivos huérfanos
 * acumulándose en el almacenamiento.
 *
 * Solo los administradores pueden escribir en `media`: lo impone la política de
 * Storage, no este código.
 */
export async function uploadCharacterIcon(slug: string, blob: Blob): Promise<string> {
  const path = `characters/${slug}.webp`;

  const { error } = await supabase.storage.from('media').upload(path, blob, {
    contentType: 'image/webp',
    upsert: true,
  });

  if (error) throw error;
  return path;
}

export async function updateCharacter(
  id: number,
  input: Partial<Pick<Character, 'icon_path' | 'color_hex' | 'initials' | 'is_active'>>
) {
  const { error } = await supabase.from('characters').update(input).eq('id', id);
  if (error) throw error;
}

export async function listPublicSettings(): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.from('site_settings').select('key,value');
  if (error) throw error;

  return Object.fromEntries(
    ((data ?? []) as Pick<SiteSetting, 'key' | 'value'>[]).map((row) => [row.key, row.value])
  );
}

export async function listAllSettings(): Promise<SiteSetting[]> {
  const { data, error } = await supabase.from('site_settings').select('*').order('key');
  if (error) throw error;
  return (data ?? []) as SiteSetting[];
}

export async function updateSetting(key: string, value: unknown) {
  const { error } = await supabase.from('site_settings').update({ value }).eq('key', key);
  if (error) throw error;
}
