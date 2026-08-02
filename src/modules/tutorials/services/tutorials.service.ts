import { supabase } from '@/shared/lib/supabase';
import type { ContentStatus, Tutorial, TutorialCategory } from '@/shared/types/database';

/** Tutoriales y sus categorías. */

export async function listTutorialCategories(): Promise<TutorialCategory[]> {
  const { data, error } = await supabase
    .from('tutorial_categories')
    .select('*')
    .order('display_order');

  if (error) throw error;
  return (data ?? []) as TutorialCategory[];
}

export async function listTutorials(): Promise<Tutorial[]> {
  const { data, error } = await supabase
    .from('tutorials')
    .select('*')
    .order('display_order')
    .order('title');

  if (error) throw error;
  return (data ?? []) as Tutorial[];
}

export async function getTutorialBySlug(slug: string): Promise<Tutorial | null> {
  const { data, error } = await supabase
    .from('tutorials')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return (data as Tutorial) ?? null;
}

/* ------------------------------ Administración ---------------------------- */

export async function listAllTutorials(): Promise<Tutorial[]> {
  const { data, error } = await supabase
    .from('tutorials')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Tutorial[];
}

export async function getTutorialById(id: string): Promise<Tutorial | null> {
  const { data, error } = await supabase
    .from('tutorials')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return (data as Tutorial) ?? null;
}

export interface TutorialInput {
  title: string;
  slug?: string;
  summary: string | null;
  body_md: string;
  category_id: number | null;
  difficulty: number;
  estimated_min: number | null;
  cover_path: string | null;
  status: ContentStatus;
  display_order: number;
  author_id?: string | null;
}

export async function createTutorial(input: TutorialInput): Promise<Tutorial> {
  const { data, error } = await supabase.from('tutorials').insert(input).select().single();
  if (error) throw error;
  return data as Tutorial;
}

export async function updateTutorial(
  id: string,
  input: Partial<TutorialInput>
): Promise<Tutorial> {
  const { data, error } = await supabase
    .from('tutorials')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Tutorial;
}

export async function deleteTutorial(id: string) {
  const { error } = await supabase.from('tutorials').delete().eq('id', id);
  if (error) throw error;
}
