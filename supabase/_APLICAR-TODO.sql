-- =============================================================================
-- SSF2X México — ESQUEMA COMPLETO EN UN SOLO ARCHIVO
-- =============================================================================
-- Archivo de conveniencia: son todas las migraciones concatenadas EN ORDEN.
-- Solo para instalaciones NUEVAS. Si tu base ya está creada, aplica únicamente
-- las migraciones que te falten desde la carpeta migrations/.
--
-- La fuente de verdad es migrations/ + seed.sql. Este archivo se regenera a
-- partir de ellos; no lo edites a mano.
-- =============================================================================

begin;



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- INICIO: migrations/0001_foundation.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- INICIO: migrations/0002_catalogs.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- =============================================================================
-- 0002_catalogs.sql
-- SSF2X México — Tablas catálogo
-- =============================================================================
-- Catálogos: conjuntos estables de valores que necesitan metadatos y que un
-- administrador puede editar sin desplegar código. Por eso son tablas, no enums.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- characters — roster del juego
-- -----------------------------------------------------------------------------
-- IMPORTANTE (legal): esta tabla guarda únicamente NOMBRES y metadatos de
-- presentación. No almacena ni referencia sprites, retratos ni ningún material
-- con copyright. El avatar por personaje se genera por código en el cliente
-- (monograma SVG con el color asignado). icon_path queda disponible por si en
-- el futuro se encarga arte original propio del proyecto.
create table public.characters (
  id             smallint     primary key,
  slug           text         not null unique,
  name           text         not null,
  -- Color de identidad para el avatar generado y para acentos en la interfaz.
  color_hex      char(7)      not null default '#FFB000'
                              check (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  -- Iniciales mostradas en el avatar generado (1-2 caracteres).
  initials       text         not null check (char_length(initials) between 1 and 2),
  -- Ruta a arte ORIGINAL del proyecto, si algún día existe. Nunca material oficial.
  icon_path      text,
  display_order  smallint     not null default 0,
  is_active      boolean      not null default true,
  created_at     timestamptz  not null default now(),
  updated_at     timestamptz  not null default now()
);

comment on table public.characters is
  'Catálogo de personajes. Solo nombres y metadatos: sin material con copyright.';
comment on column public.characters.color_hex is
  'Color de identidad usado por el avatar generado por código.';

create index characters_active_order_idx
  on public.characters (display_order)
  where is_active;

create trigger characters_set_updated_at
  before update on public.characters
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- tutorial_categories — agrupación de guías
-- -----------------------------------------------------------------------------
create table public.tutorial_categories (
  id             smallint     generated always as identity primary key,
  slug           text         not null unique,
  name           text         not null,
  description    text,
  display_order  smallint     not null default 0,
  is_active      boolean      not null default true,
  created_at     timestamptz  not null default now(),
  updated_at     timestamptz  not null default now()
);

comment on table public.tutorial_categories is
  'Categorías de tutoriales (instalación, fundamentos, personajes, netplay...).';

create trigger tutorial_categories_set_updated_at
  before update on public.tutorial_categories
  for each row execute function public.set_updated_at();


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- INICIO: migrations/0003_profiles.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- =============================================================================
-- 0003_profiles.sql
-- SSF2X México — Jugadores, datos privados y control de roles
-- =============================================================================
-- DECISIÓN CENTRAL DE PRIVACIDAD
--
-- Los datos personales se separan físicamente en dos tablas:
--
--   public.profiles         → datos PÚBLICOS (nickname, ciudad, país, personaje)
--   public.profile_private  → datos PRIVADOS (nombre real, fecha de nacimiento)
--
-- ¿Por qué separarlos en lugar de ocultar columnas?
-- La API de Supabase es pública: cualquiera puede consultar una tabla con la
-- anon key. RLS filtra FILAS, no COLUMNAS. Si el nombre real y la fecha de
-- nacimiento vivieran en la misma tabla que los datos públicos, cualquier
-- política que permita leer perfiles ajenos expondría también esos campos.
-- Separándolos, la garantía "nunca se muestra el correo ni la fecha de
-- nacimiento" deja de depender del código de la interfaz y pasa a ser
-- estructural. El correo ni siquiera se copia aquí: vive solo en auth.users,
-- que no está expuesto por la API.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- profiles — datos públicos del jugador
-- -----------------------------------------------------------------------------
create table public.profiles (
  id                 uuid           primary key
                                    references auth.users (id) on delete cascade,

  -- Identidad pública. La unicidad insensible a mayúsculas se garantiza con el
  -- índice funcional de más abajo: "Daigo" y "daigo" no pueden coexistir.
  nickname           text           not null
                                    check (nickname ~ '^[A-Za-z0-9_.\-]{3,20}$'),

  country_code       char(2)        not null default 'MX'
                                    check (country_code ~ '^[A-Z]{2}$'),
  city               text           check (char_length(city) <= 80),
  bio                text           check (char_length(bio) <= 280),

  main_character_id  smallint       references public.characters (id)
                                    on delete set null,

  avatar_source      public.avatar_source not null default 'character',
  -- Ruta relativa dentro del bucket, no URL completa: si cambia el dominio o el
  -- proyecto de Supabase no hay que reescribir la base de datos.
  avatar_path        text,

  role               public.user_role      not null default 'player',
  status             public.account_status not null default 'active',

  created_at         timestamptz    not null default now(),
  updated_at         timestamptz    not null default now(),

  -- Coherencia: si el avatar es subido debe existir la ruta.
  constraint profiles_avatar_path_required
    check (avatar_source <> 'upload' or avatar_path is not null)
);

comment on table public.profiles is
  'Datos PÚBLICOS del jugador. La información sensible vive en profile_private.';
comment on column public.profiles.role is
  'Nunca modificable por el propio usuario: lo impide el trigger profiles_protect_privileged_fields.';

create unique index profiles_nickname_lower_key
  on public.profiles (lower(nickname));

create index profiles_main_character_idx
  on public.profiles (main_character_id);

create index profiles_admins_idx
  on public.profiles (id)
  where role = 'admin';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- profile_private — información personal, jamás pública
-- -----------------------------------------------------------------------------
create table public.profile_private (
  id           uuid        primary key
                           references public.profiles (id) on delete cascade,
  full_name    text        check (char_length(full_name) <= 120),
  birth_date   date        check (birth_date > date '1930-01-01'
                                  and birth_date < current_date),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.profile_private is
  'Datos personales. Solo accesibles por su dueño y por administradores. Nunca se exponen en vistas públicas.';

create trigger profile_private_set_updated_at
  before update on public.profile_private
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- is_admin() — pieza clave de toda la seguridad
-- -----------------------------------------------------------------------------
-- SECURITY DEFINER es obligatorio, no una preferencia. Si una política RLS sobre
-- profiles consultara profiles directamente para averiguar el rol, PostgreSQL
-- volvería a evaluar esa misma política y entraría en RECURSIÓN INFINITA,
-- dejando la tabla inaccesible. Al ejecutarse como propietario, esta función
-- omite RLS y rompe el ciclo.
--
-- search_path = '' obliga a calificar todo con su esquema y evita ataques de
-- secuestro de search_path, que es el riesgo clásico de SECURITY DEFINER.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
      and p.status = 'active'
  );
$$;

comment on function public.is_admin() is
  'Indica si el usuario actual es administrador activo. SECURITY DEFINER para evitar recursión de RLS.';

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;


-- -----------------------------------------------------------------------------
-- Protección de campos privilegiados
-- -----------------------------------------------------------------------------
-- Sin esto, un usuario podría hacerse administrador con una sola llamada a la
-- API: UPDATE profiles SET role='admin' WHERE id = <su propio id>, que su
-- política de "editar mi fila" permitiría. El trigger revierte silenciosamente
-- cualquier intento de tocar campos privilegiados si quien edita no es admin.
--
-- La excepción de auth.uid() IS NULL es necesaria y es segura:
--   * Necesaria porque el bootstrap del primer administrador se hace por SQL
--     directo, donde no hay JWT y por tanto auth.uid() es NULL. Sin esta
--     excepción el UPDATE se revertiría en silencio y sería imposible crear
--     el primer admin (verificado: ocurría en la primera versión de este
--     archivo).
--   * Segura porque una petición anónima vía API tampoco tiene auth.uid(),
--     pero no puede llegar hasta aquí: la única política de UPDATE sobre
--     profiles exige id = auth.uid(), que con NULL no selecciona ninguna fila.
--     Es decir, solo alcanzan este camino las conexiones directas a la base
--     (SQL Editor, service_role), que ya son de confianza por definición.
create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and not public.is_admin() then
    new.role       := old.role;
    new.status     := old.status;
    new.created_at := old.created_at;
  end if;
  new.id := old.id;
  return new;
end;
$$;

-- ORDEN DE LOS TRIGGERS: PostgreSQL los ejecuta en orden alfabético por nombre.
-- El prefijo numérico es intencional. La protección de campos debe correr ANTES
-- que la validación del último administrador; si no, un intento no autorizado
-- de degradar produciría una excepción ruidosa en lugar de revertirse en
-- silencio, que es el comportamiento deseado.
create trigger profiles_01_protect_privileged_fields
  before update on public.profiles
  for each row execute function public.protect_profile_privileged_fields();


-- Impide que desaparezca el último administrador y el sitio quede sin gestión.
create or replace function public.prevent_last_admin_removal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_remaining int;
begin
  if old.role = 'admin'
     and (new.role <> 'admin' or new.status <> 'active') then
    select count(*) into v_remaining
    from public.profiles
    where role = 'admin' and status = 'active' and id <> old.id;

    if v_remaining = 0 then
      raise exception
        'No se puede degradar al último administrador activo del sitio.';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_02_prevent_last_admin_removal
  before update on public.profiles
  for each row execute function public.prevent_last_admin_removal();


-- -----------------------------------------------------------------------------
-- Creación automática del perfil al registrarse
-- -----------------------------------------------------------------------------
-- Garantiza el invariante "todo usuario tiene perfil". Si el perfil se creara
-- desde el cliente tras el registro, un fallo de red dejaría cuentas huérfanas
-- imposibles de usar.
--
-- Colisión de nickname: aunque el formulario valida disponibilidad antes de
-- enviar, dos registros simultáneos pueden chocar. En ese caso se añade un
-- sufijo en lugar de abortar el registro: es preferible un nickname con sufijo
-- (editable después) a un usuario que no puede completar su alta.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_meta      jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_nickname  text;
  v_candidate text;
  v_attempt   int := 0;
begin
  -- Se limpian los caracteres no permitidos pero SE RESPETA LA CAPITALIZACIÓN:
  -- "ElJefe" debe seguir mostrándose como "ElJefe". La unicidad insensible a
  -- mayúsculas la garantiza el índice funcional sobre lower(nickname), no la
  -- normalización del texto. (Una versión previa aplicaba slugify aquí y
  -- convertía todos los nicknames a minúsculas.)
  v_nickname := regexp_replace(
    btrim(coalesce(v_meta ->> 'nickname', '')),
    '[^A-Za-z0-9_.\-]', '', 'g'
  );

  if v_nickname is null or char_length(v_nickname) < 3 then
    v_nickname := 'player-' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  v_nickname  := substr(v_nickname, 1, 20);
  v_candidate := v_nickname;

  while exists (
    select 1 from public.profiles p where lower(p.nickname) = lower(v_candidate)
  ) loop
    v_attempt   := v_attempt + 1;
    v_candidate := substr(v_nickname, 1, 16) || '-' || v_attempt::text;
    exit when v_attempt > 999;
  end loop;

  insert into public.profiles (
    id, nickname, country_code, city, main_character_id, avatar_source
  ) values (
    new.id,
    v_candidate,
    coalesce(upper(nullif(v_meta ->> 'country_code', '')), 'MX'),
    nullif(v_meta ->> 'city', ''),
    nullif(v_meta ->> 'main_character_id', '')::smallint,
    coalesce(nullif(v_meta ->> 'avatar_source', '')::public.avatar_source, 'character')
  );

  insert into public.profile_private (id, full_name, birth_date)
  values (
    new.id,
    nullif(v_meta ->> 'full_name', ''),
    nullif(v_meta ->> 'birth_date', '')::date
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- -----------------------------------------------------------------------------
-- Disponibilidad de nickname (para validación en vivo del formulario)
-- -----------------------------------------------------------------------------
-- Se expone como función y no como consulta directa para no dar a usuarios
-- anónimos la capacidad de enumerar la tabla de perfiles.
create or replace function public.is_nickname_available(p_nickname text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.profiles p
    where lower(p.nickname) = lower(btrim(p_nickname))
  );
$$;

revoke execute on function public.is_nickname_available(text) from public;
grant execute on function public.is_nickname_available(text) to anon, authenticated;


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- INICIO: migrations/0004_content.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- =============================================================================
-- 0004_content.sql
-- SSF2X México — Noticias y tutoriales
-- =============================================================================
-- El cuerpo del contenido se almacena en Markdown (body_md), no en HTML.
-- Razón: es portable, versionable, legible en crudo y no queda atado al editor
-- que se use hoy. El HTML generado por un WYSIWYG envejece mal y migrarlo
-- dentro de cinco años sería doloroso.
--
-- Aunque solo los administradores escriben contenido, el Markdown se sanitiza
-- al renderizar (sin HTML crudo) por defensa en profundidad.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- news — noticias de la comunidad
-- -----------------------------------------------------------------------------
create table public.news (
  id            uuid                  primary key default gen_random_uuid(),
  slug          text                  not null unique,
  title         text                  not null check (char_length(title) between 3 and 160),
  excerpt       text                  check (char_length(excerpt) <= 320),
  body_md       text                  not null,
  cover_path    text,
  status        public.content_status not null default 'draft',
  published_at  timestamptz,
  is_featured   boolean               not null default false,
  view_count    integer               not null default 0,
  author_id     uuid                  references public.profiles (id) on delete set null,
  created_at    timestamptz           not null default now(),
  updated_at    timestamptz           not null default now(),

  -- Una noticia publicada siempre tiene fecha de publicación. Sin esta
  -- restricción aparecerían noticias sin fecha en el listado cronológico.
  constraint news_published_needs_date
    check (status <> 'published' or published_at is not null)
);

comment on table public.news is 'Noticias de la comunidad en orden cronológico.';
comment on column public.news.is_featured is 'Destaca la noticia en la portada.';

-- Índice del listado público: filtra por estado y ordena por fecha.
create index news_public_listing_idx
  on public.news (published_at desc)
  where status = 'published';

create index news_author_idx on public.news (author_id);

create trigger news_set_slug
  before insert or update on public.news
  for each row execute function public.set_slug_from('title');

create trigger news_set_updated_at
  before update on public.news
  for each row execute function public.set_updated_at();


-- Fija published_at automáticamente la primera vez que se publica.
-- Evita el error humano de publicar con una fecha equivocada.
create or replace function public.set_published_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create trigger news_set_published_at
  before insert or update on public.news
  for each row execute function public.set_published_at();


-- -----------------------------------------------------------------------------
-- tutorials — guías (la primera será "Cómo instalar Fightcade")
-- -----------------------------------------------------------------------------
create table public.tutorials (
  id             uuid                  primary key default gen_random_uuid(),
  slug           text                  not null unique,
  title          text                  not null check (char_length(title) between 3 and 160),
  summary        text                  check (char_length(summary) <= 320),
  body_md        text                  not null,
  category_id    smallint              references public.tutorial_categories (id)
                                       on delete set null,
  -- 1 = principiante, 2 = intermedio, 3 = avanzado
  difficulty     smallint              not null default 1 check (difficulty between 1 and 3),
  estimated_min  smallint              check (estimated_min > 0),
  cover_path     text,
  status         public.content_status not null default 'draft',
  published_at   timestamptz,
  display_order  smallint              not null default 0,
  author_id      uuid                  references public.profiles (id) on delete set null,
  created_at     timestamptz           not null default now(),
  updated_at     timestamptz           not null default now(),

  constraint tutorials_published_needs_date
    check (status <> 'published' or published_at is not null)
);

comment on table public.tutorials is
  'Guías de la comunidad. display_order permite un orden pedagógico, no cronológico.';

create index tutorials_public_listing_idx
  on public.tutorials (category_id, display_order)
  where status = 'published';

create trigger tutorials_set_slug
  before insert or update on public.tutorials
  for each row execute function public.set_slug_from('title');

create trigger tutorials_set_published_at
  before insert or update on public.tutorials
  for each row execute function public.set_published_at();

create trigger tutorials_set_updated_at
  before update on public.tutorials
  for each row execute function public.set_updated_at();


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- INICIO: migrations/0005_events.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- =============================================================================
-- 0005_events.sql
-- SSF2X México — Eventos, torneos y resultados
-- =============================================================================
-- Este es el corazón del proyecto. Es la información que no se puede rehacer:
-- un frontend se reescribe en un fin de semana, el historial de diez años de
-- torneos no. Por eso este archivo es el más conservador del esquema.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- events
-- -----------------------------------------------------------------------------
-- Todas las fechas son timestamptz (UTC internamente). La conversión a hora de
-- México ocurre solo al mostrar. Guardar horas "ingenuas" es la causa número uno
-- de torneos anunciados con la hora equivocada.
create table public.events (
  id                uuid                primary key default gen_random_uuid(),
  slug              text                not null unique,
  name              text                not null check (char_length(name) between 3 and 160),
  description_md    text,

  kind              public.event_kind   not null default 'tournament',
  mode              public.event_mode   not null default 'online',
  status            public.event_status not null default 'draft',

  starts_at         timestamptz         not null,
  ends_at           timestamptz,

  venue_name        text,
  venue_address     text,
  stream_url        text,
  registration_url  text,
  cover_path        text,
  max_participants  smallint            check (max_participants > 0),

  -- Válvula de escape para "información adicional" (reglas, premios, requisitos).
  -- REGLA: si un dato de aquí se necesita para filtrar, ordenar o estadística,
  -- deja de ser 'extra' y se promueve a columna real en una nueva migración.
  -- jsonb es para datos que solo se muestran.
  extra             jsonb               not null default '{}'::jsonb,

  created_by        uuid                references public.profiles (id) on delete set null,
  created_at        timestamptz         not null default now(),
  updated_at        timestamptz         not null default now(),

  constraint events_dates_coherent
    check (ends_at is null or ends_at > starts_at),

  -- Un evento presencial necesita sede; uno en línea, dónde verlo.
  constraint events_venue_required_when_presencial
    check (mode <> 'presencial' or venue_name is not null)
);

comment on table public.events is
  'Eventos de la comunidad. Los de kind=tournament admiten resultados.';
comment on column public.events.extra is
  'Datos de solo presentación. Si necesitas filtrar por un campo, promuévelo a columna.';

create index events_starts_at_idx     on public.events (starts_at desc);
create index events_status_starts_idx on public.events (status, starts_at);
create index events_kind_idx          on public.events (kind);

create trigger events_set_slug
  before insert or update on public.events
  for each row execute function public.set_slug_from('name');

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- event_results — posiciones finales
-- -----------------------------------------------------------------------------
-- DECISIÓN: una FILA POR POSICIÓN, no cuatro columnas fijas.
--
-- El requisito original pedía registrar del 1.º al 4.º lugar. Modelarlo como
-- columnas (first_place_id, second_place_id...) sería rígido: el día que se
-- quiera un top 8 habría que migrar la tabla con datos en producción. Con
-- filas, capturar cuatro hoy y ocho mañana no requiere ningún cambio.
--
-- player_id es NULLABLE a propósito. En la práctica sube al podio gente sin
-- cuenta en el sitio; sin guest_nickname habría que inventar un perfil falso o
-- perder el dato. Ninguna de las dos opciones es aceptable en un registro
-- histórico.
--
-- character_id se guarda POR RESULTADO, no se toma del perfil: el main de un
-- jugador cambia con los años, pero el personaje que usó en un torneo concreto
-- es un hecho histórico. Este campo es lo que hará posibles las estadísticas de
-- meta-juego de la Fase 3. Los datos que no se capturan hoy no existen mañana.
create table public.event_results (
  id             uuid        primary key default gen_random_uuid(),
  event_id       uuid        not null references public.events (id) on delete cascade,
  position       smallint    not null check (position > 0),

  player_id      uuid        references public.profiles (id) on delete set null,
  guest_nickname text        check (char_length(guest_nickname) between 2 and 40),

  character_id   smallint    references public.characters (id) on delete set null,
  notes          text        check (char_length(notes) <= 240),

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  -- Siempre hay alguien identificable en cada posición.
  constraint event_results_needs_identity
    check (player_id is not null or guest_nickname is not null),

  -- No puede haber dos primeros lugares en el mismo torneo.
  constraint event_results_unique_position unique (event_id, position)
);

comment on table public.event_results is
  'Posiciones finales por evento. Una fila por posición: soporta top 4, top 8 o bracket completo.';
comment on column public.event_results.guest_nickname is
  'Nickname de un jugador sin cuenta en el sitio. Evita perder datos históricos.';
comment on column public.event_results.character_id is
  'Personaje usado EN ESE TORNEO, no el main actual del perfil. Base de las estadísticas futuras.';

-- Un jugador registrado no puede ocupar dos posiciones en el mismo evento.
-- Índice parcial en lugar de UNIQUE porque player_id admite NULL y varios
-- invitados sí pueden convivir en el mismo torneo.
create unique index event_results_unique_player_per_event
  on public.event_results (event_id, player_id)
  where player_id is not null;

create index event_results_event_position_idx on public.event_results (event_id, position);
create index event_results_player_idx         on public.event_results (player_id);
create index event_results_character_idx      on public.event_results (character_id);

create trigger event_results_set_updated_at
  before update on public.event_results
  for each row execute function public.set_updated_at();


-- Los resultados solo tienen sentido en eventos terminados. Sin esta validación
-- aparecerían podios de torneos que aún no han ocurrido.
create or replace function public.validate_result_event_state()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.event_status;
  v_kind   public.event_kind;
begin
  select e.status, e.kind into v_status, v_kind
  from public.events e where e.id = new.event_id;

  if v_status is distinct from 'finished' then
    raise exception
      'Solo se pueden registrar resultados en eventos con estado finished (estado actual: %).',
      coalesce(v_status::text, 'inexistente');
  end if;

  if v_kind not in ('tournament', 'exhibition') then
    raise exception
      'Solo los eventos de tipo tournament o exhibition admiten resultados.';
  end if;

  return new;
end;
$$;

create trigger event_results_validate_event_state
  before insert or update on public.event_results
  for each row execute function public.validate_result_event_state();


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- INICIO: migrations/0006_platform.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- =============================================================================
-- 0006_platform.sql
-- SSF2X México — Configuración del sitio y auditoría
-- =============================================================================

-- -----------------------------------------------------------------------------
-- site_settings — configuración editable sin desplegar
-- -----------------------------------------------------------------------------
-- Un registro por opción. Evita hardcodear textos, redes sociales o enlaces de
-- stream en el frontend: cambiarlos no debería requerir un despliegue.
--
-- is_public separa lo que cualquiera puede leer (redes, textos) de lo que solo
-- ve el administrador (claves de integración, banderas internas).
create table public.site_settings (
  key         text        primary key check (key ~ '^[a-z0-9_.]+$'),
  value       jsonb       not null default '{}'::jsonb,
  description text,
  is_public   boolean     not null default true,
  updated_by  uuid        references public.profiles (id) on delete set null,
  updated_at  timestamptz not null default now()
);

comment on table public.site_settings is
  'Configuración del sitio en clave/valor. is_public define si el anónimo puede leerla.';

create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- audit_log — trazabilidad de acciones administrativas
-- -----------------------------------------------------------------------------
-- No estaba en los requisitos originales. Se incluye porque en comunidades con
-- varios administradores aparece tarde o temprano la pregunta "¿quién cambió
-- esto?", y no poder responderla genera conflictos. Cuesta un trigger.
create table public.audit_log (
  id         bigint      generated always as identity primary key,
  actor_id   uuid        references public.profiles (id) on delete set null,
  action     text        not null,
  entity     text        not null,
  entity_id  text,
  diff       jsonb,
  created_at timestamptz not null default now()
);

comment on table public.audit_log is
  'Registro de cambios en entidades administrables. Solo lectura, y solo para administradores.';

create index audit_log_created_at_idx on public.audit_log (created_at desc);
create index audit_log_entity_idx     on public.audit_log (entity, entity_id);
create index audit_log_actor_idx      on public.audit_log (actor_id);


create or replace function public.log_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id text;
begin
  v_id := coalesce(to_jsonb(new) ->> 'id', to_jsonb(old) ->> 'id');

  insert into public.audit_log (actor_id, action, entity, entity_id, diff)
  values (
    (select auth.uid()),
    lower(tg_op),
    tg_table_name,
    v_id,
    case tg_op
      when 'INSERT' then jsonb_build_object('after',  to_jsonb(new))
      when 'DELETE' then jsonb_build_object('before', to_jsonb(old))
      else jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new))
    end
  );

  return coalesce(new, old);
end;
$$;

comment on function public.log_audit() is
  'Trigger AFTER: escribe el cambio en audit_log con el usuario responsable.';

-- Se audita todo lo que un administrador puede modificar.
-- profile_private NO se audita: guardaría datos personales duplicados en el log,
-- lo que contradice el diseño de privacidad de la migración 0003.
create trigger news_audit
  after insert or update or delete on public.news
  for each row execute function public.log_audit();

create trigger events_audit
  after insert or update or delete on public.events
  for each row execute function public.log_audit();

create trigger event_results_audit
  after insert or update or delete on public.event_results
  for each row execute function public.log_audit();

create trigger tutorials_audit
  after insert or update or delete on public.tutorials
  for each row execute function public.log_audit();

create trigger site_settings_audit
  after insert or update or delete on public.site_settings
  for each row execute function public.log_audit();


-- En profiles solo se auditan los cambios sensibles (rol y estado). Auditar cada
-- vez que alguien cambia su ciudad llenaría el log de ruido sin valor.
create or replace function public.log_profile_privileged_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     or new.status is distinct from old.status then
    insert into public.audit_log (actor_id, action, entity, entity_id, diff)
    values (
      (select auth.uid()),
      'privileged_update',
      'profiles',
      new.id::text,
      jsonb_build_object(
        'before', jsonb_build_object('role', old.role, 'status', old.status),
        'after',  jsonb_build_object('role', new.role, 'status', new.status)
      )
    );
  end if;
  return new;
end;
$$;

create trigger profiles_audit_privileged
  after update on public.profiles
  for each row execute function public.log_profile_privileged_change();


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- INICIO: migrations/0007_views.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- =============================================================================
-- 0007_views.sql
-- SSF2X México — Vistas: el contrato público de la base de datos
-- =============================================================================
-- El frontend lee vistas y escribe tablas. Así, si mañana hay que reorganizar
-- una tabla, la vista amortigua el cambio y el cliente no se entera.
--
-- Todas las vistas usan security_invoker = true. Con la opción por defecto
-- (security_definer) la vista se ejecutaría con los permisos de su propietario
-- y podría SALTARSE RLS silenciosamente — un error frecuente y grave en
-- proyectos Supabase. Con security_invoker, las políticas del usuario que
-- consulta siguen aplicándose.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- players_public — perfil público
-- -----------------------------------------------------------------------------
-- Nunca expone correo, nombre real ni fecha de nacimiento. No por omisión al
-- escribirla, sino porque esos datos viven en otra tabla (profile_private) a la
-- que esta vista no toca.
create or replace view public.players_public
with (security_invoker = true) as
select
  p.id,
  p.nickname,
  p.city,
  p.country_code,
  p.bio,
  p.avatar_source,
  p.avatar_path,
  p.role,
  p.created_at,
  c.id       as character_id,
  c.slug     as character_slug,
  c.name     as character_name,
  c.color_hex as character_color,
  c.initials as character_initials
from public.profiles p
left join public.characters c on c.id = p.main_character_id
where p.status = 'active';

comment on view public.players_public is
  'Proyección pública del jugador. Sin datos personales por construcción.';


-- -----------------------------------------------------------------------------
-- event_results_public — resultados listos para mostrar
-- -----------------------------------------------------------------------------
-- Resuelve los joins en la base de datos y no en el cliente: una sola petición
-- en lugar de tres, y la lógica de "jugador registrado o invitado" vive en un
-- único lugar.
create or replace view public.event_results_public
with (security_invoker = true) as
select
  r.id,
  r.event_id,
  e.slug        as event_slug,
  e.name        as event_name,
  e.starts_at   as event_date,
  e.kind        as event_kind,
  r.position,
  r.player_id,
  -- Nombre a mostrar: el del perfil si existe, si no el del invitado.
  coalesce(p.nickname, r.guest_nickname) as display_nickname,
  (r.player_id is not null and p.id is not null) as is_registered,
  p.city        as player_city,
  p.avatar_source,
  p.avatar_path,
  c.id          as character_id,
  c.name        as character_name,
  c.slug        as character_slug,
  c.color_hex   as character_color,
  r.notes
from public.event_results r
join public.events e            on e.id = r.event_id
left join public.profiles p     on p.id = r.player_id and p.status = 'active'
left join public.characters c   on c.id = r.character_id
where e.status = 'finished';

comment on view public.event_results_public is
  'Resultados con jugador y personaje ya resueltos. Evita joins en el cliente.';


-- -----------------------------------------------------------------------------
-- player_stats — estadísticas por jugador
-- -----------------------------------------------------------------------------
-- La interfaz de reportes es Fase 3, pero la vista se crea ahora porque define
-- qué datos hay que capturar desde el primer torneo. Un historial no se puede
-- reconstruir retroactivamente.
create or replace view public.player_stats
with (security_invoker = true) as
select
  p.id                                                as player_id,
  p.nickname,
  count(r.id)                                         as tournaments_played,
  count(*) filter (where r.position = 1)              as first_places,
  count(*) filter (where r.position = 2)              as second_places,
  count(*) filter (where r.position = 3)              as third_places,
  count(*) filter (where r.position <= 3)             as podiums,
  min(r.position)                                     as best_position,
  round(avg(r.position)::numeric, 2)                  as average_position,
  max(e.starts_at)                                    as last_tournament_at
from public.profiles p
left join public.event_results r on r.player_id = p.id
left join public.events e
       on e.id = r.event_id
      and e.status = 'finished'
      and e.kind = 'tournament'
where p.status = 'active'
group by p.id, p.nickname;

comment on view public.player_stats is
  'Agregados por jugador. Base del perfil público y del módulo de reportes (Fase 3).';


-- -----------------------------------------------------------------------------
-- character_usage_stats — uso de personajes en torneos
-- -----------------------------------------------------------------------------
-- Responde "¿qué personaje domina el meta mexicano?". Solo será posible porque
-- event_results guarda el personaje usado en cada torneo.
create or replace view public.character_usage_stats
with (security_invoker = true) as
select
  c.id       as character_id,
  c.slug     as character_slug,
  c.name     as character_name,
  c.color_hex,
  count(r.id)                            as times_placed,
  count(*) filter (where r.position = 1) as wins,
  count(*) filter (where r.position <= 3) as podiums,
  count(distinct p.id)                   as players_using_as_main
from public.characters c
left join public.event_results r on r.character_id = c.id
left join public.events e
       on e.id = r.event_id and e.status = 'finished'
left join public.profiles p
       on p.main_character_id = c.id and p.status = 'active'
where c.is_active
group by c.id, c.slug, c.name, c.color_hex;

comment on view public.character_usage_stats is
  'Uso de personajes en resultados. Insumo del módulo de reportes.';


-- -----------------------------------------------------------------------------
-- upcoming_events — próximos eventos
-- -----------------------------------------------------------------------------
create or replace view public.upcoming_events
with (security_invoker = true) as
select
  e.id, e.slug, e.name, e.description_md, e.kind, e.mode, e.status,
  e.starts_at, e.ends_at, e.venue_name, e.venue_address,
  e.stream_url, e.registration_url, e.cover_path, e.max_participants, e.extra
from public.events e
where e.status in ('scheduled', 'open', 'live')
  and (e.ends_at is null or e.ends_at >= now())
order by e.starts_at asc;

comment on view public.upcoming_events is
  'Eventos vigentes ordenados por fecha. Alimenta la portada y el calendario.';


-- Las vistas se consultan desde el cliente público. Las políticas RLS de las
-- tablas subyacentes (migración 0008) son las que deciden qué filas se ven.
grant select on public.players_public         to anon, authenticated;
grant select on public.event_results_public   to anon, authenticated;
grant select on public.player_stats           to anon, authenticated;
grant select on public.character_usage_stats  to anon, authenticated;
grant select on public.upcoming_events        to anon, authenticated;


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- INICIO: migrations/0008_rls.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- =============================================================================
-- 0008_rls.sql
-- SSF2X México — Row Level Security
-- =============================================================================
-- PRINCIPIO RECTOR
--
--   El frontend no protege nada. Oculta cosas. La protección está aquí.
--
-- La anon key viaja dentro del bundle de JavaScript: cualquiera puede abrir la
-- consola, copiarla y consultar la API directamente. El diseño asume que eso
-- ocurrirá. Un botón oculto no es seguridad; una política que devuelve cero
-- filas, sí.
--
-- CONVENCIONES
--   * RLS activado en TODAS las tablas, sin excepción.
--   * auth.uid() se envuelve en (select auth.uid()) para que PostgreSQL lo
--     evalúe una sola vez por consulta en lugar de una vez por fila.
--   * Políticas separadas por operación y por rol: más largas de leer, pero
--     mucho más fáciles de auditar que una política monolítica.
-- =============================================================================

alter table public.profiles            enable row level security;
alter table public.profile_private     enable row level security;
alter table public.characters          enable row level security;
alter table public.tutorial_categories enable row level security;
alter table public.news                enable row level security;
alter table public.tutorials           enable row level security;
alter table public.events              enable row level security;
alter table public.event_results       enable row level security;
alter table public.site_settings       enable row level security;
alter table public.audit_log           enable row level security;


-- =============================================================================
-- profiles
-- =============================================================================
-- Lectura pública solo de perfiles activos. Es seguro porque esta tabla ya no
-- contiene datos personales: viven en profile_private.
create policy profiles_select_public
  on public.profiles for select
  to anon, authenticated
  using (status = 'active');

-- El dueño ve su perfil aunque esté suspendido (necesita saberlo).
create policy profiles_select_own
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy profiles_select_admin
  on public.profiles for select
  to authenticated
  using ((select public.is_admin()));

-- El usuario edita su propia fila. Los campos privilegiados (role, status) los
-- revierte el trigger protect_profile_privileged_fields de la migración 0003:
-- RLS controla QUÉ FILAS, el trigger controla QUÉ COLUMNAS.
create policy profiles_update_own
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy profiles_update_admin
  on public.profiles for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- No hay política de INSERT: los perfiles solo los crea el trigger
-- handle_new_user al registrarse. Tampoco de DELETE: borrar un jugador
-- destruiría su historial de torneos. Para retirar a alguien se usa
-- status = 'suspended' o 'deleted'.


-- =============================================================================
-- profile_private — nunca visible para terceros
-- =============================================================================
create policy profile_private_select_own
  on public.profile_private for select
  to authenticated
  using (id = (select auth.uid()));

create policy profile_private_select_admin
  on public.profile_private for select
  to authenticated
  using ((select public.is_admin()));

create policy profile_private_update_own
  on public.profile_private for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Sin política para anon: el rol anónimo no puede leer esta tabla en absoluto.


-- =============================================================================
-- characters y tutorial_categories — catálogos
-- =============================================================================
create policy characters_select_public
  on public.characters for select
  to anon, authenticated
  using (is_active or (select public.is_admin()));

create policy characters_admin_all
  on public.characters for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy tutorial_categories_select_public
  on public.tutorial_categories for select
  to anon, authenticated
  using (is_active or (select public.is_admin()));

create policy tutorial_categories_admin_all
  on public.tutorial_categories for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));


-- =============================================================================
-- news
-- =============================================================================
-- Los borradores son invisibles para el público. Sin esto, cualquiera podría
-- leer una noticia antes de publicarla consultando la API directamente.
create policy news_select_published
  on public.news for select
  to anon, authenticated
  using (status = 'published' and published_at <= now());

create policy news_select_admin
  on public.news for select
  to authenticated
  using ((select public.is_admin()));

create policy news_admin_write
  on public.news for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));


-- =============================================================================
-- tutorials
-- =============================================================================
create policy tutorials_select_published
  on public.tutorials for select
  to anon, authenticated
  using (status = 'published');

create policy tutorials_select_admin
  on public.tutorials for select
  to authenticated
  using ((select public.is_admin()));

create policy tutorials_admin_write
  on public.tutorials for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));


-- =============================================================================
-- events
-- =============================================================================
create policy events_select_public
  on public.events for select
  to anon, authenticated
  using (status <> 'draft');

create policy events_select_admin
  on public.events for select
  to authenticated
  using ((select public.is_admin()));

create policy events_admin_write
  on public.events for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));


-- =============================================================================
-- event_results
-- =============================================================================
-- Solo son visibles los resultados de eventos terminados y visibles. El EXISTS
-- es barato: hay índice por event_id y la tabla de eventos es pequeña.
create policy event_results_select_public
  on public.event_results for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_results.event_id
        and e.status = 'finished'
    )
  );

create policy event_results_select_admin
  on public.event_results for select
  to authenticated
  using ((select public.is_admin()));

create policy event_results_admin_write
  on public.event_results for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));


-- =============================================================================
-- site_settings
-- =============================================================================
create policy site_settings_select_public
  on public.site_settings for select
  to anon, authenticated
  using (is_public);

create policy site_settings_select_admin
  on public.site_settings for select
  to authenticated
  using ((select public.is_admin()));

create policy site_settings_admin_write
  on public.site_settings for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));


-- =============================================================================
-- audit_log — solo lectura, y solo para administradores
-- =============================================================================
-- No hay política de INSERT: solo escriben los triggers, que son SECURITY
-- DEFINER y por tanto omiten RLS. Nadie puede insertar entradas falsas desde
-- la API. Tampoco hay UPDATE ni DELETE: un log que se puede editar no es un log.
create policy audit_log_select_admin
  on public.audit_log for select
  to authenticated
  using ((select public.is_admin()));


-- =============================================================================
-- Privilegios base
-- =============================================================================
-- RLS solo se aplica sobre los privilegios concedidos. Estos GRANT definen el
-- techo; las políticas de arriba, el filtro fino.
grant usage on schema public to anon, authenticated;

grant select on public.profiles, public.characters, public.tutorial_categories,
                public.news, public.tutorials, public.events,
                public.event_results, public.site_settings
  to anon, authenticated;

grant select on public.profile_private, public.audit_log to authenticated;

grant insert, update, delete on
  public.characters, public.tutorial_categories, public.news, public.tutorials,
  public.events, public.event_results, public.site_settings
  to authenticated;

grant update on public.profiles, public.profile_private to authenticated;

-- Las tablas nuevas no deben quedar accesibles por accidente en el futuro.
alter default privileges in schema public revoke all on tables from anon, authenticated;


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- INICIO: migrations/0009_storage.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- =============================================================================
-- 0009_storage.sql
-- SSF2X México — Buckets de Storage y sus políticas
-- =============================================================================
-- Dos buckets, con reglas distintas:
--
--   avatars : escribe cada usuario en SU carpeta. Lectura pública.
--   media    : escribe solo el administrador. Lectura pública.
--
-- Los límites de tamaño se declaran aquí, en el servidor, además de validarse
-- en el cliente. La validación del navegador se puede saltar; esta no.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Buckets
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars', 'avatars', true,
  524288,  -- 512 KB. El cliente redimensiona y convierte a WebP antes de subir,
           -- así que este límite es holgado para un avatar de 256x256.
  array['image/webp', 'image/png', 'image/jpeg']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true,
  3145728,  -- 3 MB para portadas de noticias, eventos y tutoriales.
  array['image/webp', 'image/png', 'image/jpeg', 'image/gif']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;


-- -----------------------------------------------------------------------------
-- avatars
-- -----------------------------------------------------------------------------
-- Convención de ruta OBLIGATORIA: {user_id}/avatar.webp
-- La política compara la primera carpeta del path con el uid del usuario, así
-- que nadie puede escribir en la carpeta de otro aunque conozca su id.
create policy "avatars: lectura pública"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'avatars');

create policy "avatars: subir en carpeta propia"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "avatars: actualizar el propio"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "avatars: borrar el propio"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select public.is_admin())
    )
  );


-- -----------------------------------------------------------------------------
-- media — solo administradores escriben
-- -----------------------------------------------------------------------------
create policy "media: lectura pública"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'media');

create policy "media: escritura de administradores"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media' and (select public.is_admin()));

create policy "media: actualización de administradores"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'media' and (select public.is_admin()))
  with check (bucket_id = 'media' and (select public.is_admin()));

create policy "media: borrado de administradores"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));


-- -----------------------------------------------------------------------------
-- Limpieza del avatar anterior
-- -----------------------------------------------------------------------------
-- Sin esto, cada cambio de avatar dejaría el archivo viejo huérfano en el bucket
-- y el almacenamiento crecería sin control. Al forzar siempre el mismo nombre
-- de archivo por usuario ({uid}/avatar.webp) el archivo se sobrescribe y el
-- problema desaparece; esta función queda como utilidad de mantenimiento para
-- borrar restos de usuarios eliminados.
create or replace function public.cleanup_orphan_avatars()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede ejecutar la limpieza de avatares.';
  end if;

  with removed as (
    delete from storage.objects o
    where o.bucket_id = 'avatars'
      and not exists (
        select 1 from public.profiles p
        where p.id::text = (storage.foldername(o.name))[1]
      )
    returning 1
  )
  select count(*) into v_deleted from removed;

  return v_deleted;
end;
$$;

comment on function public.cleanup_orphan_avatars() is
  'Borra avatares sin perfil asociado. Uso manual desde el panel de administración.';


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- INICIO: migrations/0010_future_modules.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- =============================================================================
-- 0010_future_modules.sql
-- SSF2X México — Módulos preparados para fases posteriores
-- =============================================================================
-- Estas tablas se crean AHORA, vacías y con su RLS puesta, aunque no tengan
-- interfaz hasta la Fase 3.
--
-- ¿Por qué crearlas antes de usarlas? Porque agregar tablas relacionadas a una
-- base de datos vacía cuesta cinco minutos, y hacerlo con datos en producción y
-- usuarios conectados cuesta una ventana de mantenimiento. El coste de tenerlas
-- vacías es cero.
--
-- Lo que NO se hace aquí es adivinar campos que dependan de decisiones futuras.
-- Se modela solo lo que ya se sabe con certeza.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- overlays — configuración de overlays para OBS (Fase 3)
-- -----------------------------------------------------------------------------
-- El overlay se consume desde /overlay/:key como fuente de navegador en OBS.
-- Se identifica por 'key' y no por uuid para que la URL sea escribible a mano
-- por el streamer.
create table public.overlays (
  id          uuid        primary key default gen_random_uuid(),
  key         text        not null unique check (key ~ '^[a-z0-9\-]{3,40}$'),
  name        text        not null,
  type        text        not null default 'scoreboard',
  config      jsonb       not null default '{}'::jsonb,
  is_active   boolean     not null default false,
  created_by  uuid        references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.overlays is
  'Configuración de overlays de OBS. Se consume en /overlay/:key. Fase 3.';

create trigger overlays_set_updated_at
  before update on public.overlays
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- stream_state — estado en vivo del stream (Fase 3)
-- -----------------------------------------------------------------------------
-- Tabla de una sola fila (singleton). El overlay se suscribe por Realtime y se
-- actualiza sin recargar. El CHECK sobre id garantiza que no puedan existir dos
-- estados en conflicto.
create table public.stream_state (
  id             boolean     primary key default true check (id),
  event_id       uuid        references public.events (id) on delete set null,
  player1_label  text,
  player1_score  smallint    not null default 0 check (player1_score >= 0),
  player1_char_id smallint   references public.characters (id) on delete set null,
  player2_label  text,
  player2_score  smallint    not null default 0 check (player2_score >= 0),
  player2_char_id smallint   references public.characters (id) on delete set null,
  round_label    text,
  is_live        boolean     not null default false,
  updated_by     uuid        references public.profiles (id) on delete set null,
  updated_at     timestamptz not null default now()
);

comment on table public.stream_state is
  'Marcador en vivo, fila única. Los overlays se suscriben por Realtime. Fase 3.';

insert into public.stream_state (id) values (true) on conflict do nothing;

create trigger stream_state_set_updated_at
  before update on public.stream_state
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- polls / poll_options / poll_votes — votaciones en stream (Fase 3)
-- -----------------------------------------------------------------------------
-- AVISO ANTICIPADO: votar sin cuenta NO se puede asegurar solo con RLS, porque
-- nada impide a un script votar mil veces. Habrá dos caminos posibles:
--   (a) exigir sesión iniciada  → simple, RLS puro, ya soportado por user_id
--   (b) Edge Function + Turnstile → permite votar sin cuenta, usa fingerprint
-- El esquema soporta ambos: user_id es nullable y existe fingerprint. La
-- decisión se toma en Fase 3, no ahora.
create table public.polls (
  id          uuid        primary key default gen_random_uuid(),
  question    text        not null check (char_length(question) between 3 and 200),
  event_id    uuid        references public.events (id) on delete set null,
  is_open     boolean     not null default false,
  requires_auth boolean   not null default true,
  opens_at    timestamptz,
  closes_at   timestamptz,
  created_by  uuid        references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.poll_options (
  id            uuid     primary key default gen_random_uuid(),
  poll_id       uuid     not null references public.polls (id) on delete cascade,
  label         text     not null check (char_length(label) between 1 and 80),
  display_order smallint not null default 0
);

create table public.poll_votes (
  id           uuid        primary key default gen_random_uuid(),
  poll_id      uuid        not null references public.polls (id) on delete cascade,
  option_id    uuid        not null references public.poll_options (id) on delete cascade,
  user_id      uuid        references public.profiles (id) on delete cascade,
  -- Huella del navegador, solo para el modo sin autenticación.
  fingerprint  text,
  created_at   timestamptz not null default now(),

  constraint poll_votes_needs_identity
    check (user_id is not null or fingerprint is not null)
);

-- Un voto por usuario autenticado y por encuesta.
create unique index poll_votes_unique_user
  on public.poll_votes (poll_id, user_id)
  where user_id is not null;

-- Mitigación (no garantía) para el modo anónimo.
create unique index poll_votes_unique_fingerprint
  on public.poll_votes (poll_id, fingerprint)
  where user_id is null and fingerprint is not null;

create index poll_options_poll_idx on public.poll_options (poll_id, display_order);
create index poll_votes_poll_idx   on public.poll_votes (poll_id, option_id);

create trigger polls_set_updated_at
  before update on public.polls
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- matches — combates individuales (Fase 3)
-- -----------------------------------------------------------------------------
-- La Fase 1 registra solo posiciones finales, tal como se pidió. Esta tabla
-- queda lista por si algún día se registra el bracket completo. No interfiere
-- con event_results: son dos niveles de detalle independientes.
create table public.matches (
  id              uuid        primary key default gen_random_uuid(),
  event_id        uuid        not null references public.events (id) on delete cascade,
  round_label     text,
  match_order     smallint,
  player1_id      uuid        references public.profiles (id) on delete set null,
  player1_guest   text,
  player1_char_id smallint    references public.characters (id) on delete set null,
  player1_score   smallint    check (player1_score >= 0),
  player2_id      uuid        references public.profiles (id) on delete set null,
  player2_guest   text,
  player2_char_id smallint    references public.characters (id) on delete set null,
  player2_score   smallint    check (player2_score >= 0),
  vod_url         text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index matches_event_idx on public.matches (event_id, match_order);

create trigger matches_set_updated_at
  before update on public.matches
  for each row execute function public.set_updated_at();


-- =============================================================================
-- RLS de los módulos futuros
-- =============================================================================
-- Se activa desde ahora. Una tabla sin RLS en Supabase es una tabla abierta al
-- mundo: dejarlas "para después" es exactamente el descuido que provoca fugas.
alter table public.overlays      enable row level security;
alter table public.stream_state  enable row level security;
alter table public.polls         enable row level security;
alter table public.poll_options  enable row level security;
alter table public.poll_votes    enable row level security;
alter table public.matches       enable row level security;

create policy overlays_select_public on public.overlays for select
  to anon, authenticated using (is_active or (select public.is_admin()));
create policy overlays_admin_all on public.overlays for all
  to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy stream_state_select_public on public.stream_state for select
  to anon, authenticated using (true);
create policy stream_state_admin_write on public.stream_state for update
  to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy polls_select_public on public.polls for select
  to anon, authenticated using (is_open or (select public.is_admin()));
create policy polls_admin_all on public.polls for all
  to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy poll_options_select_public on public.poll_options for select
  to anon, authenticated using (
    exists (select 1 from public.polls p where p.id = poll_options.poll_id and p.is_open)
    or (select public.is_admin())
  );
create policy poll_options_admin_all on public.poll_options for all
  to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Los votos individuales no son públicos: el sitio muestra agregados.
create policy poll_votes_insert_authenticated on public.poll_votes for insert
  to authenticated with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.polls p where p.id = poll_id and p.is_open)
  );
create policy poll_votes_select_own on public.poll_votes for select
  to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy matches_select_public on public.matches for select
  to anon, authenticated using (
    exists (select 1 from public.events e where e.id = matches.event_id and e.status <> 'draft')
  );
create policy matches_admin_all on public.matches for all
  to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

grant select on public.overlays, public.stream_state, public.polls,
                public.poll_options, public.matches
  to anon, authenticated;
grant select, insert on public.poll_votes to authenticated;
grant insert, update, delete on public.overlays, public.polls, public.poll_options,
                                public.matches to authenticated;
grant update on public.stream_state to authenticated;


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- INICIO: migrations/0011_fix_upcoming_events.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- =============================================================================
-- 0011_fix_upcoming_events.sql
-- SSF2X México — Corrección de la vista upcoming_events
-- =============================================================================
-- PROBLEMA DETECTADO EN PRODUCCIÓN
--
-- La versión original filtraba así:
--
--   where status in ('scheduled','open','live')
--     and (ends_at is null or ends_at >= now())
--
-- El campo ends_at es opcional y casi nunca se llena. Cuando está vacío, la
-- condición se cumple siempre, así que un evento programado con fecha PASADA
-- se quedaba para siempre en "Próximos eventos" y en la portada.
--
-- SOLUCIÓN
--
-- Se usa la fecha de fin real si existe y, si no, se asume que el evento dura
-- unas horas desde su inicio. Así:
--   * un torneo de esta tarde sigue apareciendo mientras ocurre,
--   * uno del mes pasado desaparece solo, sin que nadie tenga que acordarse
--     de cambiarle el estado a 'finished'.
--
-- El margen de 8 horas cubre un torneo largo sin dejar eventos zombis.
-- Los eventos marcados como 'live' se respetan siempre: si alguien puso ese
-- estado a mano, es porque está sucediendo ahora.
-- =============================================================================

create or replace view public.upcoming_events
with (security_invoker = true) as
select
  e.id, e.slug, e.name, e.description_md, e.kind, e.mode, e.status,
  e.starts_at, e.ends_at, e.venue_name, e.venue_address,
  e.stream_url, e.registration_url, e.cover_path, e.max_participants, e.extra
from public.events e
where e.status in ('scheduled', 'open', 'live')
  and (
    e.status = 'live'
    or coalesce(e.ends_at, e.starts_at + interval '8 hours') >= now()
  )
order by e.starts_at asc;

comment on view public.upcoming_events is
  'Eventos vigentes ordenados por fecha. Los pasados salen solos aunque nadie cambie su estado.';

grant select on public.upcoming_events to anon, authenticated;


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- INICIO: seed.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- =============================================================================
-- seed.sql
-- SSF2X México — Datos iniciales
-- =============================================================================
-- Idempotente: se puede ejecutar varias veces sin duplicar nada.
--
-- NOTA LEGAL: solo se guardan nombres, iniciales y un color de identidad
-- elegido para la interfaz. No hay sprites, retratos ni ningún material con
-- copyright. El avatar por personaje se dibuja por código en el navegador como
-- monograma SVG usando 'initials' y 'color_hex'.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Personajes — roster de Super Street Fighter II X (17)
-- -----------------------------------------------------------------------------
insert into public.characters (id, slug, name, initials, color_hex, display_order) values
  ( 1, 'ryu',      'Ryu',       'RY', '#E8E8F0',  1),
  ( 2, 'ken',      'Ken',       'KE', '#FF3B30',  2),
  ( 3, 'chun-li',  'Chun-Li',   'CH', '#3B82F6',  3),
  ( 4, 'guile',    'Guile',     'GU', '#4ADE80',  4),
  ( 5, 'blanka',   'Blanka',    'BL', '#22C55E',  5),
  ( 6, 'zangief',  'Zangief',   'ZA', '#B91C1C',  6),
  ( 7, 'dhalsim',  'Dhalsim',   'DH', '#F97316',  7),
  ( 8, 'e-honda',  'E. Honda',  'EH', '#EC4899',  8),
  ( 9, 'balrog',   'Balrog',    'BA', '#7C3AED',  9),
  (10, 'vega',     'Vega',      'VE', '#A855F7', 10),
  (11, 'sagat',    'Sagat',     'SA', '#EAB308', 11),
  (12, 'm-bison',  'M. Bison',  'MB', '#DC2626', 12),
  (13, 'cammy',    'Cammy',     'CA', '#10B981', 13),
  (14, 'fei-long', 'Fei Long',  'FL', '#F59E0B', 14),
  (15, 'dee-jay',  'Dee Jay',   'DJ', '#06B6D4', 15),
  (16, 't-hawk',   'T. Hawk',   'TH', '#EA580C', 16),
  (17, 'akuma',    'Akuma',     'AK', '#9333EA', 17)
on conflict (id) do update
  set slug          = excluded.slug,
      name          = excluded.name,
      initials      = excluded.initials,
      color_hex     = excluded.color_hex,
      display_order = excluded.display_order;


-- -----------------------------------------------------------------------------
-- Categorías de tutoriales
-- -----------------------------------------------------------------------------
insert into public.tutorial_categories (slug, name, description, display_order) values
  ('instalacion', 'Instalación',
   'Cómo dejar todo listo para jugar en línea.', 1),
  ('fundamentos', 'Fundamentos',
   'Conceptos básicos: espaciamiento, defensa, ejecución.', 2),
  ('personajes',  'Personajes',
   'Guías específicas por personaje.', 3),
  ('netplay',     'Juego en línea',
   'Netcode, retraso, configuración de red y buenas prácticas.', 4),
  ('competitivo', 'Competitivo',
   'Reglas de torneo, formatos y preparación.', 5)
on conflict (slug) do update
  set name          = excluded.name,
      description   = excluded.description,
      display_order = excluded.display_order;


-- -----------------------------------------------------------------------------
-- Configuración inicial del sitio
-- -----------------------------------------------------------------------------
insert into public.site_settings (key, value, description, is_public) values
  ('site.title',
   '"SSF2X México"'::jsonb,
   'Título del sitio.', true),

  ('site.tagline',
   '"La comunidad mexicana de Super Street Fighter II X"'::jsonb,
   'Lema mostrado en la portada.', true),

  ('site.contact_email',
   '"ssfxmx@gmail.com"'::jsonb,
   'Correo de contacto público.', true),

  ('social.links',
   '{"discord": "", "youtube": "", "twitch": "", "x": "", "facebook": ""}'::jsonb,
   'Redes sociales de la comunidad. Las vacías no se muestran.', true),

  ('home.hero_text',
   '"Torneos mensuales, resultados y comunidad. Desde 1994, seguimos jugando."'::jsonb,
   'Texto principal de la portada.', true),

  ('events.default_timezone',
   '"America/Mexico_City"'::jsonb,
   'Zona horaria mostrada en eventos. Las fechas se guardan siempre en UTC.', true),

  ('registration.enabled',
   'true'::jsonb,
   'Permite cerrar el registro sin desplegar código si hubiera abuso.', true),

  ('features.captcha_enabled',
   'false'::jsonb,
   'Bandera para activar CAPTCHA en Fase 2 sin tocar el código.', false)
on conflict (key) do nothing;


-- =============================================================================
-- PRIMER ADMINISTRADOR — se hace a mano, y a propósito
-- =============================================================================
-- El rol de administrador no se puede obtener desde la aplicación por ningún
-- camino. El primero se asigna aquí, una sola vez:
--
--   1) Regístrate normalmente en el sitio con ssfxmx@gmail.com
--   2) Confirma el correo
--   3) Ejecuta esto en el SQL Editor de Supabase:
--
--        update public.profiles
--        set role = 'admin'
--        where id = (select id from auth.users where email = 'ssfxmx@gmail.com');
--
--   4) Comprueba que funcionó:
--
--        select nickname, role from public.profiles where role = 'admin';
--
-- A partir de ahí, los siguientes administradores se promueven desde el panel,
-- y cada promoción queda registrada en audit_log.
-- =============================================================================


commit;
