-- =============================================================================
-- 0013_character_icons.sql
-- SSF2X México — Exponer el icono del personaje en las vistas públicas
-- =============================================================================
-- La columna characters.icon_path existe desde la migración 0002, pero ninguna
-- vista la devolvía: el avatar se resolvía siempre como monograma generado por
-- código.
--
-- Al añadirla aquí, el frontend puede preferir el icono cuando exista y caer al
-- monograma cuando no. Los dos sistemas conviven: si un personaje no tiene
-- imagen, su avatar sigue funcionando igual que antes. Eso también significa
-- que retirar las imágenes en el futuro es vaciar una columna, no rehacer nada.
-- =============================================================================

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
  c.id        as character_id,
  c.slug      as character_slug,
  c.name      as character_name,
  c.color_hex as character_color,
  c.initials  as character_initials,
  c.icon_path as character_icon_path
from public.profiles p
left join public.characters c on c.id = p.main_character_id
where p.status = 'active';

comment on view public.players_public is
  'Proyección pública del jugador. Sin datos personales por construcción.';


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
  coalesce(p.nickname, r.guest_nickname) as display_nickname,
  (r.player_id is not null and p.id is not null) as is_registered,
  p.city        as player_city,
  p.avatar_source,
  p.avatar_path,
  c.id          as character_id,
  c.name        as character_name,
  c.slug        as character_slug,
  c.color_hex   as character_color,
  r.notes,
  -- Las columnas nuevas van AL FINAL a propósito: `create or replace view` solo
  -- admite añadir columnas después de las existentes. Insertarlas en medio
  -- falla con "cannot change name of view column", porque PostgreSQL compara
  -- posición por posición.
  c.initials    as character_initials,
  c.icon_path   as character_icon_path
from public.event_results r
join public.events e            on e.id = r.event_id
left join public.profiles p     on p.id = r.player_id and p.status = 'active'
left join public.characters c   on c.id = r.character_id
where e.status = 'finished';

comment on view public.event_results_public is
  'Resultados con jugador y personaje ya resueltos. Evita joins en el cliente.';


grant select on public.players_public       to anon, authenticated;
grant select on public.event_results_public to anon, authenticated;
