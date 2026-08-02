/**
 * Tipos del esquema de base de datos.
 *
 * Este archivo debe reflejar exactamente supabase/migrations/. Cuando cambie el
 * esquema, regenéralo con:
 *
 *   supabase gen types typescript --linked > src/shared/types/database.ts
 *
 * Está escrito a mano en la Fase 1 para no obligar a instalar la CLI antes de
 * arrancar. La ventaja de tenerlo tipado es que un cambio en la base rompe la
 * compilación en lugar de romper la producción.
 */

// --- Enumerados (espejo de 0001_foundation.sql) ------------------------------

export type UserRole = 'admin' | 'player';
export type AccountStatus = 'active' | 'suspended' | 'deleted';
export type ContentStatus = 'draft' | 'published' | 'archived';
export type EventStatus =
  | 'draft'
  | 'scheduled'
  | 'open'
  | 'live'
  | 'finished'
  | 'cancelled';
export type EventKind = 'tournament' | 'casual' | 'exhibition' | 'workshop';
export type EventMode = 'online' | 'presencial' | 'hibrido';
export type AvatarSource = 'character' | 'upload';

// --- Tablas ------------------------------------------------------------------

export interface Character {
  id: number;
  slug: string;
  name: string;
  color_hex: string;
  initials: string;
  icon_path: string | null;
  display_order: number;
  is_active: boolean;
}

export interface Profile {
  id: string;
  nickname: string;
  country_code: string;
  city: string | null;
  bio: string | null;
  main_character_id: number | null;
  avatar_source: AvatarSource;
  avatar_path: string | null;
  role: UserRole;
  status: AccountStatus;
  created_at: string;
  updated_at: string;
}

/** Datos personales. Solo los lee su dueño o un administrador. */
export interface ProfilePrivate {
  id: string;
  full_name: string | null;
  birth_date: string | null;
}

export interface News {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body_md: string;
  cover_path: string | null;
  status: ContentStatus;
  published_at: string | null;
  is_featured: boolean;
  view_count: number;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventRecord {
  id: string;
  slug: string;
  name: string;
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
  extra: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventResult {
  id: string;
  event_id: string;
  position: number;
  player_id: string | null;
  guest_nickname: string | null;
  character_id: number | null;
  notes: string | null;
}

export interface TutorialCategory {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

export interface Tutorial {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  body_md: string;
  category_id: number | null;
  difficulty: number;
  estimated_min: number | null;
  cover_path: string | null;
  status: ContentStatus;
  published_at: string | null;
  display_order: number;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteSetting {
  key: string;
  value: unknown;
  description: string | null;
  is_public: boolean;
  updated_at: string;
}

export interface AuditLogEntry {
  id: number;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  diff: Record<string, unknown> | null;
  created_at: string;
}

// --- Vistas (espejo de 0007_views.sql) ---------------------------------------

/** Proyección pública del jugador. Sin correo, nombre real ni fecha de nacimiento. */
export interface PlayerPublic {
  id: string;
  nickname: string;
  city: string | null;
  country_code: string;
  bio: string | null;
  avatar_source: AvatarSource;
  avatar_path: string | null;
  role: UserRole;
  created_at: string;
  character_id: number | null;
  character_slug: string | null;
  character_name: string | null;
  character_color: string | null;
  character_initials: string | null;
}

export interface EventResultPublic {
  id: string;
  event_id: string;
  event_slug: string;
  event_name: string;
  event_date: string;
  event_kind: EventKind;
  position: number;
  player_id: string | null;
  display_nickname: string;
  is_registered: boolean;
  player_city: string | null;
  avatar_source: AvatarSource | null;
  avatar_path: string | null;
  character_id: number | null;
  character_name: string | null;
  character_slug: string | null;
  character_color: string | null;
  notes: string | null;
}

export interface PlayerStats {
  player_id: string;
  nickname: string;
  tournaments_played: number;
  first_places: number;
  second_places: number;
  third_places: number;
  podiums: number;
  best_position: number | null;
  average_position: number | null;
  last_tournament_at: string | null;
}

export interface CharacterUsageStats {
  character_id: number;
  character_slug: string;
  character_name: string;
  color_hex: string;
  times_placed: number;
  wins: number;
  podiums: number;
  players_using_as_main: number;
}
