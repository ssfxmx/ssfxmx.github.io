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
