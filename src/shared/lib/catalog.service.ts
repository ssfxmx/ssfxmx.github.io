import { supabase } from '@/shared/lib/supabase';
import type { Character, SiteSetting } from '@/shared/types/database';

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
