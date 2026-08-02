-- =============================================================================
-- DATOS DE PRUEBA — SSF2X México
-- =============================================================================
-- Cinco torneos pasados con sus resultados, para ver cómo se comporta el sitio
-- con contenido real antes de que exista contenido real.
--
-- TODO lo que crea este archivo lleva el prefijo `demo-` en su slug y la marca
-- {"_demo": true} en el campo extra. Con eso basta para borrarlo entero sin
-- tocar nada legítimo, aunque para entonces ya haya torneos de verdad.
--
-- Los jugadores se registran como INVITADOS (guest_nickname), no como cuentas.
-- Así no se ensucia el directorio de jugadores ni la tabla de autenticación:
-- los datos de prueba viven solo en los resultados, que es donde se quieren ver.
--
-- =============================================================================
-- PARA BORRARLO TODO — copia y ejecuta solo este bloque:
-- =============================================================================
--
--   delete from public.highlights where slug like 'demo-%';
--   delete from public.news       where slug like 'demo-%';
--   delete from public.events     where slug like 'demo-%';
--
--   -- Verifica que no quedó nada:
--   select 'eventos' as tabla, count(*) from public.events     where slug like 'demo-%'
--   union all
--   select 'noticias',        count(*) from public.news       where slug like 'demo-%';
--
-- Los resultados se borran solos: event_results tiene ON DELETE CASCADE sobre
-- el evento. No hace falta borrarlos por separado.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Los cinco torneos
-- -----------------------------------------------------------------------------
-- Fechas relativas a hoy, así el archivo no envejece: siempre serán cinco
-- torneos mensuales recientes sin importar cuándo se ejecute.
insert into public.events (
  slug, name, description_md, kind, mode, status,
  starts_at, ends_at, venue_name, venue_address, stream_url,
  max_participants, extra, created_by
) values
(
  'demo-torneo-mensual-1',
  '[DEMO] Torneo Mensual — Edición 1',
  E'Primer torneo mensual de la comunidad.\n\nFormato de doble eliminación, combates al mejor de tres y finales al mejor de cinco.',
  'tournament', 'online', 'finished',
  now() - interval '5 months', now() - interval '5 months' + interval '5 hours',
  'Fightcade', null, 'https://twitch.tv/ejemplo',
  16, '{"_demo": true, "reglas": "Doble eliminación, Bo3", "premios": "Gloria eterna"}'::jsonb,
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'demo-torneo-mensual-2',
  '[DEMO] Torneo Mensual — Edición 2',
  E'Segunda edición, con más participantes que la primera.',
  'tournament', 'online', 'finished',
  now() - interval '4 months', now() - interval '4 months' + interval '5 hours',
  'Fightcade', null, 'https://twitch.tv/ejemplo',
  24, '{"_demo": true, "reglas": "Doble eliminación, Bo3"}'::jsonb,
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'demo-torneo-presencial-cdmx',
  '[DEMO] Torneo Presencial CDMX',
  E'Primer torneo presencial. Gabinetes prestados por la comunidad.\n\nAmbiente de sala de máquinas, con público y todo.',
  'tournament', 'presencial', 'finished',
  now() - interval '3 months', now() - interval '3 months' + interval '8 hours',
  'Salón Arcade Centro', 'Calle Ejemplo 123, Cuauhtémoc, CDMX', null,
  32, '{"_demo": true, "reglas": "Doble eliminación", "premios": "Bolsa repartida entre top 3"}'::jsonb,
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'demo-torneo-mensual-4',
  '[DEMO] Torneo Mensual — Edición 4',
  E'Cuarta edición del circuito mensual.',
  'tournament', 'online', 'finished',
  now() - interval '2 months', now() - interval '2 months' + interval '4 hours',
  'Fightcade', null, 'https://twitch.tv/ejemplo',
  24, '{"_demo": true}'::jsonb,
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'demo-copa-invierno',
  '[DEMO] Copa de Invierno',
  E'Torneo especial de fin de temporada, con los mejores del circuito mensual.',
  'tournament', 'hibrido', 'finished',
  now() - interval '1 month', now() - interval '1 month' + interval '6 hours',
  'Salón Arcade Centro', 'Calle Ejemplo 123, Cuauhtémoc, CDMX', 'https://twitch.tv/ejemplo',
  16, '{"_demo": true, "reglas": "Top 8 en vivo", "premios": "Trofeo"}'::jsonb,
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
)
on conflict (slug) do nothing;


-- -----------------------------------------------------------------------------
-- Resultados
-- -----------------------------------------------------------------------------
-- Nombres ficticios. Se repiten entre torneos a propósito: así las estadísticas
-- acumuladas (torneos jugados, podios, mejor puesto) tienen algo que mostrar y
-- se puede comprobar que suman bien.
--
-- El personaje se guarda por resultado, no por jugador: algunos cambian de main
-- entre torneos, que es justo el caso que el esquema debe soportar.

-- Edición 1 — top 8
insert into public.event_results (event_id, position, guest_nickname, character_id)
select e.id, v.position, v.nickname, v.character_id
from public.events e,
  (values
    (1, 'ElBrujoMX',    11),  -- Sagat
    (2, 'ChilangoST',    3),  -- Chun-Li
    (3, 'RayoTapatio',   2),  -- Ken
    (4, 'DonaJuanita',   6),  -- Zangief
    (5, 'NortenoFuerte', 4),  -- Guile
    (6, 'PixelPerro',    1),  -- Ryu
    (7, 'LaCatrina',    13),  -- Cammy
    (8, 'TurboAbuelo',   8)   -- E. Honda
  ) as v(position, nickname, character_id)
where e.slug = 'demo-torneo-mensual-1'
on conflict do nothing;

-- Edición 2 — top 8
insert into public.event_results (event_id, position, guest_nickname, character_id)
select e.id, v.position, v.nickname, v.character_id
from public.events e,
  (values
    (1, 'ChilangoST',    3),
    (2, 'ElBrujoMX',    11),
    (3, 'LaCatrina',    13),
    (4, 'RayoTapatio',   2),
    (5, 'ManoDePiedra', 16),  -- T. Hawk
    (6, 'DonaJuanita',   6),
    (7, 'PixelPerro',    1),
    (8, 'SombraDeAkuma',17)   -- Akuma
  ) as v(position, nickname, character_id)
where e.slug = 'demo-torneo-mensual-2'
on conflict do nothing;

-- Presencial CDMX — top 8
insert into public.event_results (event_id, position, guest_nickname, character_id)
select e.id, v.position, v.nickname, v.character_id
from public.events e,
  (values
    (1, 'RayoTapatio',   2),
    (2, 'ChilangoST',    3),
    (3, 'ElBrujoMX',    11),
    (4, 'SombraDeAkuma',17),
    (5, 'NortenoFuerte', 4),
    (6, 'LaCatrina',    13),
    (7, 'ManoDePiedra', 16),
    (8, 'ElYogaFlame',   7)   -- Dhalsim
  ) as v(position, nickname, character_id)
where e.slug = 'demo-torneo-presencial-cdmx'
on conflict do nothing;

-- Edición 4 — top 4
insert into public.event_results (event_id, position, guest_nickname, character_id)
select e.id, v.position, v.nickname, v.character_id
from public.events e,
  (values
    (1, 'ElBrujoMX',    11),
    (2, 'DonaJuanita',   6),
    (3, 'ChilangoST',    3),
    (4, 'PixelPerro',    1)
  ) as v(position, nickname, character_id)
where e.slug = 'demo-torneo-mensual-4'
on conflict do nothing;

-- Copa de Invierno — top 8
insert into public.event_results (event_id, position, guest_nickname, character_id)
select e.id, v.position, v.nickname, v.character_id
from public.events e,
  (values
    (1, 'ChilangoST',    3),
    (2, 'RayoTapatio',   2),
    (3, 'ElBrujoMX',    12),  -- cambió a M. Bison
    (4, 'LaCatrina',    13),
    (5, 'DonaJuanita',   6),
    (6, 'SombraDeAkuma',17),
    (7, 'NortenoFuerte', 4),
    (8, 'ManoDePiedra', 16)
  ) as v(position, nickname, character_id)
where e.slug = 'demo-copa-invierno'
on conflict do nothing;


-- -----------------------------------------------------------------------------
-- Un par de noticias, para que la portada no se vea vacía
-- -----------------------------------------------------------------------------
insert into public.news (slug, title, excerpt, body_md, status, is_featured, author_id)
values
(
  'demo-resumen-copa-invierno',
  '[DEMO] ChilangoST se lleva la Copa de Invierno',
  'Cierre de temporada con final reñida y un cambio de personaje que nadie vio venir.',
  E'La Copa de Invierno cerró la temporada con una final que se decidió en el último asalto.\n\n## Lo más comentado\n\nEl tercer lugar cambió de personaje a mitad del torneo, algo que casi nadie hace a ese nivel, y le funcionó hasta semifinales.\n\n## Próximos torneos\n\nEl circuito mensual regresa el mes que viene. Atentos a la sección de Eventos.',
  'published', true,
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'demo-bienvenida',
  '[DEMO] Arranca la nueva página de la comunidad',
  'Ya puedes registrarte, consultar resultados y seguir los torneos desde un solo lugar.',
  E'Después de años de organizarnos por chat, la comunidad tiene por fin un lugar propio.\n\n## Qué encuentras aquí\n\n- Calendario de torneos\n- Resultados históricos\n- Perfiles de jugadores con sus estadísticas\n- Guías para empezar desde cero\n\nRegístrate y aparece en el directorio.',
  'published', false,
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
)
on conflict (slug) do nothing;


-- -----------------------------------------------------------------------------
-- Verificación
-- -----------------------------------------------------------------------------
select 'eventos demo'   as tabla, count(*)::text as total from public.events where slug like 'demo-%'
union all
select 'resultados',    count(*)::text from public.event_results r
  join public.events e on e.id = r.event_id where e.slug like 'demo-%'
union all
select 'noticias demo', count(*)::text from public.news where slug like 'demo-%';
