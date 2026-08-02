-- =============================================================================
-- Corrige y completa el highlight "KELA420 VS DEMOSDM"
-- =============================================================================
-- DOS COSAS QUE ARREGLA
--
-- 1. La plataforma estaba guardada como 'other'. El detector no reconocía el
--    formato facebook.com/share/r/..., que es el que produce el botón de
--    compartir de Facebook y por tanto el más habitual. El código ya está
--    corregido, pero este registro se guardó antes y hay que actualizarlo a
--    mano: la plataforma se persiste al crear el highlight, no se recalcula al
--    mostrarlo.
--
-- 2. Faltaba la descripción.
--
-- NOTA: no puedo ver el contenido del video, así que el texto describe el
-- combate a partir del título y del torneo al que está vinculado. Ajústalo
-- desde Panel → Highlights si algo no cuadra.
-- =============================================================================

-- El enlace también se actualiza: el que estaba guardado (19HKV2cLmd) era de un
-- intento anterior. Este es el que devuelve el botón "Compartir → Generar
-- enlace" de Facebook para el clip correcto.
update public.highlights set
  url = 'https://www.facebook.com/share/r/1EpSckaTS2/',
  platform = 'facebook',
  embed_id = '1EpSckaTS2',
  description = 'Duelo entre KELA420 y DEMOSDM en la segunda edición de Rey de la Farmacia. Se abre en Facebook.'
where slug = 'kela420-vs-demosdm';


-- -----------------------------------------------------------------------------
-- Verificación
-- -----------------------------------------------------------------------------
select
  h.title,
  h.platform,
  case when h.description is null then '❌ sin descripción' else '✅' end as descripcion,
  e.name as torneo,
  h.status
from public.highlights h
left join public.events e on e.id = h.event_id;
