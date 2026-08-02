import { supabase } from '@/shared/lib/supabase';
import type { ContentStatus } from '@/shared/types/database';
import type { Platform } from '@/shared/utils/socialLinks';

/** Highlights: clips y videos de la comunidad alojados en redes. */

export interface Highlight {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  url: string;
  platform: Platform;
  embed_id: string | null;
  thumbnail_url: string | null;
  event_id: string | null;
  status: ContentStatus;
  published_at: string | null;
  is_featured: boolean;
  display_order: number;
  created_at: string;
}

/** Vista pública: incluye el nombre del torneo ya resuelto. */
export interface HighlightPublic extends Omit<Highlight, 'status' | 'created_at'> {
  event_slug: string | null;
  event_name: string | null;
  event_date: string | null;
}

export async function listHighlights(): Promise<HighlightPublic[]> {
  const { data, error } = await supabase
    .from('highlights_public')
    .select('*')
    .order('is_featured', { ascending: false })
    .order('published_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as HighlightPublic[];
}

export async function getHighlightBySlug(slug: string): Promise<HighlightPublic | null> {
  const { data, error } = await supabase
    .from('highlights_public')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return (data as HighlightPublic) ?? null;
}

export async function listHighlightsByEvent(eventId: string): Promise<HighlightPublic[]> {
  const { data, error } = await supabase
    .from('highlights_public')
    .select('*')
    .eq('event_id', eventId)
    .order('display_order');

  if (error) throw error;
  return (data ?? []) as HighlightPublic[];
}

/* ------------------------------ Administración ---------------------------- */

export async function listAllHighlights(): Promise<Highlight[]> {
  const { data, error } = await supabase
    .from('highlights')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Highlight[];
}

export async function getHighlightById(id: string): Promise<Highlight | null> {
  const { data, error } = await supabase
    .from('highlights')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return (data as Highlight) ?? null;
}

export interface HighlightInput {
  title: string;
  description: string | null;
  url: string;
  platform: Platform;
  embed_id: string | null;
  thumbnail_url: string | null;
  event_id: string | null;
  status: ContentStatus;
  is_featured: boolean;
  display_order: number;
  created_by?: string | null;
}

export async function createHighlight(input: HighlightInput): Promise<Highlight> {
  const { data, error } = await supabase.from('highlights').insert(input).select().single();
  if (error) throw error;
  return data as Highlight;
}

export async function updateHighlight(
  id: string,
  input: Partial<HighlightInput>
): Promise<Highlight> {
  const { data, error } = await supabase
    .from('highlights')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Highlight;
}

export async function deleteHighlight(id: string) {
  const { error } = await supabase.from('highlights').delete().eq('id', id);
  if (error) throw error;
}
