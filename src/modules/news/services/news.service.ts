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

export interface NewsFilters {
  /** Texto libre: busca en título y resumen. */
  search?: string;
  /** Año de publicación como cadena, p. ej. "2021". Vacío = todos. */
  year?: string;
}

/**
 * Listado público, filtrado y paginado EN EL SERVIDOR.
 *
 * Filtrar en el cliente sería más simple de escribir, pero solo funcionaría
 * sobre la página que ya está cargada: buscar "kumite" no encontraría nada si
 * esa noticia está en la página 3. La paginación y el filtro tienen que vivir
 * en el mismo sitio o dan resultados que no se corresponden con lo que la
 * persona pidió.
 */
export async function listNews(
  page = 1,
  pageSize = 9,
  filters: NewsFilters = {}
): Promise<NewsListResult> {
  const from = (page - 1) * pageSize;

  let query = supabase
    .from('news')
    .select('*', { count: 'exact' })
    .order('published_at', { ascending: false });

  const search = filters.search?.trim();
  if (search) {
    // Se escapan las comas porque PostgREST las usa para separar condiciones
    // dentro de `or`: sin esto, buscar "Hokuto, Yito2K" rompería la consulta.
    const safe = search.replace(/[,()]/g, ' ');
    query = query.or(`title.ilike.%${safe}%,excerpt.ilike.%${safe}%`);
  }

  if (filters.year) {
    query = query
      .gte('published_at', `${filters.year}-01-01T00:00:00Z`)
      .lt('published_at', `${Number(filters.year) + 1}-01-01T00:00:00Z`);
  }

  const { data, error, count } = await query.range(from, from + pageSize - 1);

  if (error) throw error;
  return { items: (data ?? []) as News[], total: count ?? 0 };
}

/**
 * Año de la noticia más antigua, para construir el desplegable de años.
 * Trae una sola fila: no hace falta leer el archivo entero para saber dónde
 * empieza.
 */
export async function getOldestNewsYear(): Promise<number | null> {
  const { data, error } = await supabase
    .from('news')
    .select('published_at')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data?.published_at) return null;
  return new Date(data.published_at).getFullYear();
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
  // Se ordena por fecha de publicación, igual que el listado público, para que
  // el panel muestre las noticias en el mismo orden que ve la gente. Los
  // borradores (sin fecha) quedan al final.
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .order('published_at', { ascending: false, nullsFirst: false })
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
  /**
   * Fecha de publicación. Se puede fijar a mano para cargar noticias antiguas
   * con su fecha real; si se deja vacía al publicar, el trigger de la base pone
   * la de hoy.
   */
  published_at?: string | null;
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
