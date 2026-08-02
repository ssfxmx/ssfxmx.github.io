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
