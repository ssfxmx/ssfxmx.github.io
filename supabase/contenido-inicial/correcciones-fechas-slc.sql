-- =============================================================================
-- Super Lucha Callejera — corrección de fechas
-- =============================================================================
-- FUENTE: las miniaturas de los propios videos. Los carteles llevan la fecha
-- impresa ("FRIDAY NIGHT MARCH 5") y son lo que la comunidad anunció, así que
-- pesan más que cualquier deducción a partir de la fecha de subida.
--
-- QUÉ SE ARREGLA
-- Tres eventos tenían fecha deducida de la subida del video y caían en jueves,
-- sábado y domingo. La serie era de viernes por la noche, sin excepción. El
-- cartel de cada uno confirma el viernes correcto.
--
-- Un cuarto evento, el Fatal 4 Way, tenía fecha deducida que resultó correcta:
-- se le quita la marca de "inferida" porque ya está confirmada.
--
-- POR QUÉ TAMBIÉN SE TOCAN LAS NOTICIAS
-- Cada crónica se publicó con la fecha de su evento. Si solo se corrigiera el
-- evento, la noticia quedaría fechada un día antes o después y el archivo
-- mostraría la crónica separada del evento que narra. Las dos tablas guardan la
-- misma fecha, así que las dos se corrigen a la vez.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Eventos
-- -----------------------------------------------------------------------------
update public.events
   set starts_at = '2021-03-05 20:00:00-06'
 where slug = 'slc-24';

update public.events
   set starts_at = '2021-03-19 20:00:00-06'
 where slug = 'slc-25';

update public.events
   set starts_at = '2021-08-20 20:00:00-05'
 where slug = 'slc-32';

-- El Fatal 4 Way ya no es una fecha deducida: el cartel dice "NOVEMBER 5".
update public.events
   set extra = extra - 'fecha_inferida'
 where slug = 'slc-fatal-4-way';


-- -----------------------------------------------------------------------------
-- Crónicas, para que no se separen de su evento
-- -----------------------------------------------------------------------------
update public.news
   set published_at = '2021-03-05 22:00:00-06'
 where slug = 'slc-24-krost-contra-hokuto-y-una-sesion-de-ken-contra-claw';

update public.news
   set published_at = '2021-03-19 22:00:00-06'
 where slug = 'slc-25-el-dhalsim-de-yito2k-en-el-estelar';

update public.news
   set published_at = '2021-08-20 22:00:00-05'
 where slug = 'slc-32-el-kumite-de-yito2k';


-- -----------------------------------------------------------------------------
-- Verificación: ningún evento de la serie debe caer fuera de viernes
-- -----------------------------------------------------------------------------
-- Los formatos especiales sí se salieron del viernes alguna vez, así que la
-- consulta no falla por ellos: solo lista el día de cada uno para revisarlo de
-- un vistazo. Las ediciones numeradas (slc-19 a slc-32) deben decir todas
-- "viernes".
select
  slug,
  to_char(starts_at at time zone 'America/Mexico_City', 'DD/MM/YYYY') as fecha,
  case extract(dow from starts_at at time zone 'America/Mexico_City')
    when 0 then 'domingo' when 1 then 'lunes'     when 2 then 'martes'
    when 3 then 'miércoles' when 4 then 'jueves'  when 5 then 'VIERNES'
    when 6 then 'sábado'
  end as dia,
  case when extra ? 'fecha_inferida' then 'inferida' else 'confirmada' end as origen
from public.events
where extra->>'_slc' = 'true'
order by starts_at;


-- -----------------------------------------------------------------------------
-- Verificación: cada crónica alineada con su evento
-- -----------------------------------------------------------------------------
-- Devuelve 0 filas si todas coinciden en el mismo día.
select
  n.slug as cronica,
  to_char(n.published_at at time zone 'America/Mexico_City', 'DD/MM/YYYY') as fecha_cronica,
  to_char(e.starts_at   at time zone 'America/Mexico_City', 'DD/MM/YYYY') as fecha_evento
from public.news n
join lateral (
  select (regexp_matches(n.body_md, '\(/eventos/([a-z0-9-]+)\)'))[1] as enlace
) m on true
join public.events e on e.slug = m.enlace
where n.slug like 'slc-%'
  and (n.published_at at time zone 'America/Mexico_City')::date
   <> (e.starts_at   at time zone 'America/Mexico_City')::date;
