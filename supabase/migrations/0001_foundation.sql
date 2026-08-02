-- =============================================================================
-- 0001_foundation.sql
-- SSF2X México — Tipos enumerados y funciones auxiliares
-- =============================================================================
-- Esta migración no crea tablas. Define el vocabulario del esquema (enums) y
-- las funciones que reutilizan todas las demás migraciones.
--
-- Sobre los ENUM: se usan solo para conjuntos realmente cerrados. Agregar un
-- valor a un enum es trivial; quitarlo no lo es. Lo que puede crecer o necesita
-- metadatos (personajes, categorías) se modela como tabla catálogo, no enum.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tipos enumerados
-- -----------------------------------------------------------------------------

-- Rol del usuario. Solo dos, tal como define el proyecto.
create type public.user_role as enum ('admin', 'player');

-- Estado de la cuenta. Permite moderar sin borrar historial de torneos:
-- si se borra un jugador se pierden sus resultados, y eso es inaceptable.
create type public.account_status as enum ('active', 'suspended', 'deleted');

-- Ciclo de vida del contenido editorial (noticias y tutoriales).
create type public.content_status as enum ('draft', 'published', 'archived');

-- Ciclo de vida de un evento.
-- 'draft'     : el admin lo está preparando, no visible al público
-- 'scheduled' : anunciado, aún sin inscripciones abiertas
-- 'open'      : inscripciones abiertas
-- 'live'      : sucediendo ahora (habilita el badge "EN VIVO")
-- 'finished'  : terminado, admite resultados
-- 'cancelled' : cancelado, se conserva por transparencia
create type public.event_status as enum
  ('draft', 'scheduled', 'open', 'live', 'finished', 'cancelled');

-- Tipo de evento. Los resultados solo tienen sentido en torneos, pero el
-- módulo sirve también para casuales, exhibiciones y talleres.
create type public.event_kind as enum
  ('tournament', 'casual', 'exhibition', 'workshop');

-- Modalidad del evento.
create type public.event_mode as enum ('online', 'presencial', 'hibrido');

-- Origen del avatar del jugador.
-- 'character' : se genera por código a partir del personaje principal
--               (decisión §9.1 del documento de arquitectura: no se usan
--                imágenes con copyright, el avatar es un monograma SVG)
-- 'upload'    : imagen subida por el usuario al bucket 'avatars'
create type public.avatar_source as enum ('character', 'upload');


-- -----------------------------------------------------------------------------
-- Funciones auxiliares
-- -----------------------------------------------------------------------------

-- Mantiene updated_at sin depender de que la aplicación lo recuerde.
-- Se aplica como trigger BEFORE UPDATE en todas las tablas mutables.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Trigger BEFORE UPDATE: refresca updated_at. Evita depender del cliente.';


-- Genera slugs consistentes desde un título en español.
-- No usa la extensión unaccent a propósito: mantener el esquema libre de
-- extensiones facilita replicarlo en cualquier PostgreSQL.
create or replace function public.slugify(p_text text)
returns text
language sql
immutable
as $$
  select trim(both '-' from
    regexp_replace(
      lower(translate(
        coalesce(p_text, ''),
        'áàäâãåéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÅÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
        'aaaaaaeeeeiiiiooooouuuuncAAAAAAEEEEIIIIOOOOOUUUUNC'
      )),
      '[^a-z0-9]+', '-', 'g'
    )
  );
$$;

comment on function public.slugify(text) is
  'Convierte un título en slug para URL. Quita acentos sin usar unaccent.';


-- Rellena el slug automáticamente cuando el admin no lo especifica.
-- La columna fuente se pasa como argumento del trigger (TG_ARGV[0]).
create or replace function public.set_slug_from()
returns trigger
language plpgsql
as $$
declare
  v_source text;
begin
  if new.slug is null or btrim(new.slug) = '' then
    v_source := to_jsonb(new) ->> tg_argv[0];
    new.slug := public.slugify(v_source);
  else
    new.slug := public.slugify(new.slug);
  end if;
  return new;
end;
$$;

comment on function public.set_slug_from() is
  'Trigger BEFORE INSERT/UPDATE: genera el slug desde la columna indicada en TG_ARGV[0].';
