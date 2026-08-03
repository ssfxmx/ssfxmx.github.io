-- =============================================================================
-- Super Lucha Callejera — ediciones especiales (los 9 que faltaban)
-- =============================================================================
-- Completa el playlist. Son los formatos especiales posteriores a la edición 32:
-- combates a tres y cuatro bandas, retos de un jugador contra varios, y una
-- incursión en Hyper Fighting.
--
-- SOBRE LAS FECHAS
-- Seis las dice la propia descripción del video ("On September 2nd, 2022...").
-- Tres no la mencionan; en esos casos se usa el día anterior a la subida, que
-- es el patrón constante de toda la serie: se transmitía en Twitch y el video
-- se subía al día siguiente. Van marcadas con "fecha_inferida": true en `extra`
-- para que se distingan de las confirmadas y se puedan corregir sin adivinar
-- cuáles eran.
--
-- NOMBRES
-- Tres videos se titulan igual, "Triple Threat Match". Se les añade quiénes
-- pelearon: en una lista de eventos, tres filas idénticas son inservibles.
--
-- Todos llevan la marca {"_slc": true}, igual que los anteriores.
-- =============================================================================

insert into public.events (
  slug, name, description_md, kind, mode, status,
  starts_at, venue_name, stream_url, extra, created_by
) values

(
  'slc-fatal-4-way',
  'Super Lucha Callejera: Fatal 4 Way',
  E'Estreno del formato a cuatro bandas, con Enforcer04, DemonioDebian, Goromax y Scuzbucket.\n\n## Reglas\n\n- Series a 1\n- El ganador suma un punto y se queda\n- El perdedor va al final de la fila\n- Gana el primero en llegar a 15 puntos',
  'exhibition', 'online', 'finished',
  '2021-11-05 20:00:00-06', 'Fightcade',
  'https://www.youtube.com/watch?v=I7aKhnJekpY',
  '{"_slc": true, "youtube_id": "I7aKhnJekpY", "reglas": "Fatal 4 Way, ganador se queda, a 15 puntos"}'::jsonb,
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-triple-threat-2',
  'Super Lucha Callejera: Triple Threat — Chuky94, Enforcer04, Fi3ro',
  E'Combate a tres bandas entre Chuky94, Enforcer04 y Fi3ro.\n\n## Reglas\n\n- Series a 2\n- El ganador suma un punto y se queda\n- El perdedor va al final de la fila\n- Gana el primero en llegar a 10 puntos\n\nAl terminar, Riz0ne y Hokuto mostraron técnicas específicas de Ryu, Guile y Dee Jay.',
  'exhibition', 'online', 'finished',
  '2022-05-06 20:00:00-05', 'Fightcade',
  'https://www.youtube.com/watch?v=9frhIdEdJio',
  '{"_slc": true, "youtube_id": "9frhIdEdJio", "fecha_inferida": true, "reglas": "Triple amenaza, ganador se queda, a 10 puntos"}'::jsonb,
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-triple-threat-3',
  'Super Lucha Callejera: Triple Threat — GaloDiaz, Scuzbucket, Pitufov',
  E'Combate a tres bandas entre GaloDiaz, Scuzbucket y Pitufov.\n\n## Reglas\n\n- Series a 2\n- El ganador suma un punto y se queda\n- El perdedor va al final de la fila\n- Gana el primero en llegar a 10 puntos\n\nSe resolvió todo en cerca de una hora, y hubo revancha de despecho al final.',
  'exhibition', 'online', 'finished',
  '2022-05-30 20:00:00-05', 'Fightcade',
  'https://www.youtube.com/watch?v=gof66IXg-NI',
  '{"_slc": true, "youtube_id": "gof66IXg-NI", "fecha_inferida": true, "reglas": "Triple amenaza, ganador se queda, a 10 puntos"}'::jsonb,
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-three-amigos-challenge',
  'Three Amigos Challenge: MarsGatti vs. Yito2K, Hokuto y H-Zero',
  E'Formato nuevo dentro de la serie: uno de los jugadores más fuertes de Estados Unidos contra tres de los mejores de México.\n\nMarsGatti (Estados Unidos) se midió contra Hokuto, Yito2K y H-Zero (México) en Super Street Fighter II X y en Super Street Fighter II X: New Legacy.\n\nTransmitido por Riz0ne y H-Zero.',
  'exhibition', 'online', 'finished',
  '2022-09-02 20:00:00-05', 'Fightcade',
  'https://www.youtube.com/watch?v=jn0a5a6ttng',
  '{"_slc": true, "youtube_id": "jn0a5a6ttng", "reglas": "Uno contra tres. SSF2X y New Legacy"}'::jsonb,
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-road-to-france',
  'Super Lucha Callejera: Road to France [USA vs. México]',
  E'Noche de preparación para los jugadores norteamericanos que viajaban al X Street Battle de Lyon.\n\nJPong, SilentScope y Megaman X (Estados Unidos) contra Hokuto, Yito2K y compañía (México).\n\nTransmitido por Riz0ne y H-Zero.',
  'exhibition', 'online', 'finished',
  '2022-09-16 20:00:00-05', 'Fightcade',
  'https://www.youtube.com/watch?v=rYLc5afcGqk',
  '{"_slc": true, "youtube_id": "rYLc5afcGqk", "reglas": "Preparacion para X Street Battle, Lyon"}'::jsonb,
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-triple-threat-4',
  'Super Lucha Callejera: Triple Threat y MarsGatti vs. Yito2K',
  E'Edición especial de viernes 13: combate a tres bandas más una serie FT10 de exhibición.\n\nEn el triple participaron Demonio Debian (Chun-Li) por México y Mr. Carabano (Guile), entre otros.\n\nTransmitido por Riz0ne y H-Zero.',
  'exhibition', 'online', 'finished',
  '2023-01-13 20:00:00-06', 'Fightcade',
  'https://www.youtube.com/watch?v=XSSbLs5JLrY',
  '{"_slc": true, "youtube_id": "XSSbLs5JLrY", "reglas": "Triple amenaza + FT10 de exhibicion"}'::jsonb,
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-yito2k-vs-marsgatti-ft10',
  'Super Lucha Callejera: Yito2K vs. MarsGatti — FT10 x3',
  E'Continuación del combate estelar de la edición anterior. Tres series FT10 entre los dos maestros, con una variante: antes del cierre hubo una serie de personaje principal contra personaje secundario.\n\nTransmitido por Riz0ne y H-Zero.',
  'exhibition', 'online', 'finished',
  '2023-03-03 20:00:00-06', 'Fightcade',
  'https://www.youtube.com/watch?v=1LxDHkHmsu4',
  '{"_slc": true, "youtube_id": "1LxDHkHmsu4", "reglas": "Tres series FT10, incluida main contra sub"}'::jsonb,
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-hokuto-vs-megaman-x',
  'Super Lucha Callejera: Hokuto (Claw) vs. Megaman X (Zangief)',
  E'Regreso de la serie con tres exhibiciones entre México y Estados Unidos. El combate estelar enfrentó a Hokuto con Claw contra Megaman X con Zangief.\n\nTransmitido por Riz0ne y H-Zero.',
  'exhibition', 'online', 'finished',
  '2023-09-22 20:00:00-06', 'Fightcade',
  'https://www.youtube.com/watch?v=zJ-NqiUR5HA',
  '{"_slc": true, "youtube_id": "zJ-NqiUR5HA", "reglas": "Tres exhibiciones Mexico vs USA"}'::jsonb,
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-best-hyper-fighters',
  'SLC: The Best Hyper Fighters You''ll Ever See',
  E'Incursión de la serie en **Hyper Fighting**, no en Super Turbo.\n\nCombate a tres bandas entre DJILK (Ryu), Goromax (Guile, M. Bison) y Eggsnbaconnn (Chun-Li, Dhalsim, Balrog, Sagat), en carrera a diez series ganadas.',
  'exhibition', 'online', 'finished',
  '2023-09-29 20:00:00-06', 'Fightcade',
  'https://www.youtube.com/watch?v=r4JpH95XozY',
  '{"_slc": true, "youtube_id": "r4JpH95XozY", "juego": "Hyper Fighting", "reglas": "Triple amenaza, a 10 series"}'::jsonb,
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
)

on conflict (slug) do update set
  name = excluded.name,
  description_md = excluded.description_md,
  starts_at = excluded.starts_at,
  stream_url = excluded.stream_url,
  extra = excluded.extra;


-- -----------------------------------------------------------------------------
-- Verificación: la serie completa, en orden
-- -----------------------------------------------------------------------------
select
  to_char(starts_at at time zone 'America/Mexico_City', 'DD/MM/YYYY') as fecha,
  name,
  case when extra->>'fecha_inferida' = 'true' then 'inferida' else 'confirmada' end as origen_fecha
from public.events
where extra->>'_slc' = 'true'
order by starts_at;
