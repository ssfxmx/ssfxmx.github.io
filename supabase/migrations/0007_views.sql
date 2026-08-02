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
