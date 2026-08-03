import { supabase } from '@/shared/lib/supabase';
import type {
  EventKind,
  EventMode,
  EventRecord,
  EventStatus,
} from '@/shared/types/database';

/** Eventos y torneos. */

export async function listUpcomingEvents(limit = 20): Promise<EventRecord[]> {
  const { data, error } = await supabase
    .from('upcoming_events')
    .select('*')
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as EventRecord[];
}

export interface PastEventsResult {
  items: EventRecord[];
  total: number;
}

export interface EventFilters {
  /** Texto libre: busca en el nombre del evento. */
  search?: string;
  /** Año como cadena, p. ej. "2021". Vacío = todos. */
  year?: string;
  /** Tipo de evento. Vacío = todos. */
  kind?: string;
}

/**
 * Archivo de eventos pasados, filtrado y paginado EN EL SERVIDOR.
 *
 * Antes esta función traía como mucho 50 eventos y no lo decía en ninguna
 * parte. Con 25 en el historial nadie lo habría notado; el día que la comunidad
 * llegara al evento 51, los más antiguos habrían desaparecido del sitio en
 * silencio, sin error ni aviso. Un límite invisible es peor que no tener
 * archivo, porque nadie sabe que le falta algo.
 */
export async function listPastEvents(
  page = 1,
  pageSize = 12,
  filters: EventFilters = {}
): Promise<PastEventsResult> {
  const from = (page - 1) * pageSize;

  let query = supabase
    .from('events')
    .select('*', { count: 'exact' })
    .in('status', ['finished', 'cancelled'])
    .order('starts_at', { ascending: false });

  const search = filters.search?.trim();
  if (search) {
    query = query.ilike('name', `%${search.replace(/[,()]/g, ' ')}%`);
  }

  if (filters.year) {
    query = query
      .gte('starts_at', `${filters.year}-01-01T00:00:00Z`)
      .lt('starts_at', `${Number(filters.year) + 1}-01-01T00:00:00Z`);
  }

  if (filters.kind) {
    query = query.eq('kind', filters.kind);
  }

  const { data, error, count } = await query.range(from, from + pageSize - 1);

  if (error) throw error;
  return { items: (data ?? []) as EventRecord[], total: count ?? 0 };
}

/** Año del evento pasado más antiguo, para el desplegable de años. */
export async function getOldestEventYear(): Promise<number | null> {
  const { data, error } = await supabase
    .from('events')
    .select('starts_at')
    .in('status', ['finished', 'cancelled'])
    .order('starts_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data?.starts_at) return null;
  return new Date(data.starts_at).getFullYear();
}

/** Todos los eventos visibles al público, para el calendario. */
export async function listVisibleEvents(): Promise<EventRecord[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('starts_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as EventRecord[];
}

export async function getEventBySlug(slug: string): Promise<EventRecord | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return (data as EventRecord) ?? null;
}

export async function getNextEvent(): Promise<EventRecord | null> {
  const { data, error } = await supabase
    .from('upcoming_events')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as EventRecord) ?? null;
}

/* ------------------------------ Administración ---------------------------- */

export async function listAllEvents(): Promise<EventRecord[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('starts_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as EventRecord[];
}

export async function getEventById(id: string): Promise<EventRecord | null> {
  const { data, error } = await supabase.from('events').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as EventRecord) ?? null;
}

/** Eventos que ya terminaron: son los únicos que admiten resultados. */
export async function listFinishedEvents(): Promise<EventRecord[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'finished')
    .in('kind', ['tournament', 'exhibition'])
    .order('starts_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as EventRecord[];
}

export interface EventInput {
  name: string;
  slug?: string;
  description_md: string | null;
  kind: EventKind;
  mode: EventMode;
  status: EventStatus;
  starts_at: string;
  ends_at: string | null;
  venue_name: string | null;
  venue_address: string | null;
  stream_url: string | null;
  registration_url: string | null;
  cover_path: string | null;
  max_participants: number | null;
  extra?: Record<string, unknown>;
  created_by?: string | null;
}

export async function createEvent(input: EventInput): Promise<EventRecord> {
  const { data, error } = await supabase.from('events').insert(input).select().single();
  if (error) throw error;
  return data as EventRecord;
}

export async function updateEvent(
  id: string,
  input: Partial<EventInput>
): Promise<EventRecord> {
  const { data, error } = await supabase
    .from('events')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as EventRecord;
}

export async function deleteEvent(id: string) {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
}
