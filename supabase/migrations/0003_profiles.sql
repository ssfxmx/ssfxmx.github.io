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
