-- =============================================================================
-- Portadas de las crónicas de Super Lucha Callejera
-- =============================================================================
-- Cada crónica toma la portada de su evento. No se sube nada nuevo: apuntan al
-- MISMO archivo del bucket que ya usa el evento.
--
-- POR QUÉ COMPARTEN ARCHIVO Y NO SE DUPLICA
-- Es la misma imagen contando la misma noche. Tener dos copias significaría
-- subir 24 archivos de más y, el día que se quiera cambiar el cartel de un
-- evento, acordarse de cambiarlo en dos sitios. La contrapartida: si se borra
-- el archivo del bucket, se quedan sin portada el evento Y su crónica. Es el
-- comportamiento correcto — son la misma imagen.
--
-- POR QUÉ SE DEDUCE DEL ENLACE Y NO SE ESCRIBE UNA LISTA
-- Cada crónica ya enlaza a la ficha de su evento en el cuerpo del texto. Esa
-- relación existe, así que se aprovecha en vez de mantener a mano una segunda
-- lista de 24 correspondencias que podría desincronizarse.
--
-- REQUISITO PREVIO
--   portadas-eventos-slc.sql, y las imágenes ya subidas al bucket.
--
-- DESHACER
--   update public.news set cover_path = null where slug like 'slc-%';
-- =============================================================================

update public.news n
   set cover_path = e.cover_path
  from public.events e
 where n.slug like 'slc-%'
   and e.slug = substring(n.body_md from '\(/eventos/([a-z0-9-]+)\)')
   and e.cover_path is not null;


-- La retrospectiva no narra un evento concreto: enlaza al listado completo, así
-- que la consulta anterior no la alcanza. Se le pone la portada de la edición
-- 30, el invitacional de 32 jugadores y el evento más grande de la serie.
update public.news
   set cover_path = (select cover_path from public.events where slug = 'slc-30')
 where slug = 'slc-la-serie-que-conecto-a-mexico-con-el-mundo';


-- -----------------------------------------------------------------------------
-- Verificación: las 25 crónicas con su portada
-- -----------------------------------------------------------------------------
select
  to_char(published_at at time zone 'America/Mexico_City', 'DD/MM/YYYY') as fecha,
  title,
  coalesce(cover_path, '— SIN PORTADA —') as portada
from public.news
where slug like 'slc-%'
order by published_at;


-- -----------------------------------------------------------------------------
-- Comprobación: ninguna crónica debe quedarse sin portada
-- -----------------------------------------------------------------------------
-- Devuelve 0 filas cuando todas la tienen. Si aparece alguna, es que a su
-- evento todavía le falta la imagen en el bucket.
select slug, title
from public.news
where slug like 'slc-%'
  and cover_path is null
order by published_at;
