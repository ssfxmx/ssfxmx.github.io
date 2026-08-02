import { supabase } from '@/shared/lib/supabase';
import type { ContentStatus, News } from '@/shared/types/database';

/**
 * Noticias.
 *
 * Las consultas públicas no filtran por status: no hace falta. Las políticas RLS
 * ya impiden que un visitante vea borradores. Filtrar aquí también sería
 * duplicar una regla que ya vive en la base, y duplicar reglas es cómo se
 * desincronizan.
 */

export interface NewsListResult {
  items: News[];
  total: number;
}

export async function listNews(page = 1, pageSize = 9): Promise<NewsListResult> {
  const from = (page - 1) * pageSize;

  const { data, error, count } = await supabase
    .from('news')
    .select('*', { count: 'exact' })
    .order('published_at', { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) throw error;
  return { items: (data ?? []) as News[], total: count ?? 0 };
}

export async function getNewsBySlug(slug: string): Promise<News | null> {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return (data as News) ?? null;
}

export async function listFeaturedNews(limit = 3): Promise<News[]> {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .order('is_featured', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as News[];
}

/* ------------------------------ Administración ---------------------------- */

export async function listAllNews(): Promise<News[]> {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as News[];
}

export async function getNewsById(id: string): Promise<News | null> {
  const { data, error } = await supabase.from('news').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as News) ?? null;
}

export interface NewsInput {
  title: string;
  slug?: string;
  excerpt: string | null;
  body_md: string;
  cover_path: string | null;
  status: ContentStatus;
  is_featured: boolean;
  author_id?: string | null;
}

export async function createNews(input: NewsInput): Promise<News> {
  const { data, error } = await supabase.from('news').insert(input).select().single();
  if (error) throw error;
  return data as News;
}

export async function updateNews(id: string, input: Partial<NewsInput>): Promise<News> {
  const { data, error } = await supabase
    .from('news')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as News;
}

export async function deleteNews(id: string) {
  const { error } = await supabase.from('news').delete().eq('id', id);
  if (error) throw error;
}
