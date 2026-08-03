-- =============================================================================
-- Portadas de los eventos de Super Lucha Callejera
-- =============================================================================
-- Asigna a cada uno de los 24 eventos su miniatura, ya subida al bucket 'media'.
--
-- REQUISITO PREVIO
--   1. Correr scripts/descargar-miniaturas-slc.ps1
--   2. Subir los 24 archivos a Supabase -> Storage -> media -> carpeta "events"
--
-- Si se corre antes de subir las imagenes no se rompe nada: las fichas
-- quedarian con un enlace a un archivo que no existe y el navegador mostraria
-- el hueco. Se arregla subiendo los archivos, sin tocar la base.
--
-- SOBRE EL NOMBRE DE LOS ARCHIVOS
-- El panel de administracion nombra las portadas con un UUID (events/<uuid>.jpg)
-- para que dos imagenes con el mismo nombre no se pisen. Aqui se usa el slug del
-- evento en su lugar, a proposito: son 24 archivos que se suben de una vez y de
-- fuera del panel, y con UUIDs esta lista habria que generarla a mano despues de
-- subir, mirando que nombre le toco a cada uno. Con el slug, el archivo y el
-- evento se llaman igual y la correspondencia se verifica de un vistazo.
--
-- Las portadas que se suban desde el panel a partir de ahora seguiran usando
-- UUID; ambas convenciones conviven sin problema porque cover_path es solo una
-- ruta de texto.
--
-- DESHACER
--   update public.events set cover_path = null where extra->>'_slc' = 'true';
-- =============================================================================

update public.events e
   set cover_path = 'events/' || e.slug || '.jpg'
 where e.extra->>'_slc' = 'true';


-- -----------------------------------------------------------------------------
-- Verificacion: los 24 eventos con su ruta de portada
-- -----------------------------------------------------------------------------
select
  to_char(starts_at at time zone 'America/Mexico_City', 'DD/MM/YYYY') as fecha,
  name,
  cover_path
from public.events
where extra->>'_slc' = 'true'
order by starts_at;


-- -----------------------------------------------------------------------------
-- Comprobacion: que cada portada exista de verdad en el bucket
-- -----------------------------------------------------------------------------
-- Devuelve 0 filas cuando las 24 imagenes estan subidas. Si devuelve alguna,
-- ese archivo falta en Storage -> media -> events.
select e.slug, e.cover_path as archivo_que_falta
from public.events e
left join storage.objects o
       on o.bucket_id = 'media'
      and o.name = e.cover_path
where e.extra->>'_slc' = 'true'
  and e.cover_path is not null
  and o.id is null
order by e.starts_at;
