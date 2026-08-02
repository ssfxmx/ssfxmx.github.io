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

export async function listPastEvents(limit = 50): Promise<EventRecord[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .in('status', ['finished', 'cancelled'])
    .order('starts_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as EventRecord[];
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
