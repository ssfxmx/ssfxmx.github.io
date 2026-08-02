-- =============================================================================
-- Contenido — Noticias existentes, completadas
-- =============================================================================
-- Rellena las dos noticias que ya estaban publicadas pero con campos vacíos o
-- muy escuetos. Se respeta la voz de la comunidad: tono casual y emoji, tal
-- como ya venían escritas.
--
-- El RESUMEN importa más de lo que parece: es lo que se ve en el listado y,
-- sobre todo, lo que aparece como vista previa al compartir el enlace en
-- WhatsApp o Discord. Sin él, la tarjeta sale vacía justo cuando alguien está
-- intentando traer gente al sitio.
--
-- Todo esto se puede editar después desde Panel → Noticias.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Lanzamiento del sitio
-- -----------------------------------------------------------------------------
update public.news set
  title = '🕹️ ¡Ya tenemos página oficial!',
  excerpt = 'La comunidad de Super Turbo en México ya tiene casa propia: torneos, resultados, perfiles y guías en un solo lugar.',
  body_md = $md$
Después de años organizándonos por chat, la comunidad de Super Street Fighter II X en México ya tiene un lugar propio.

## Qué vas a encontrar aquí

**📅 Eventos** — cuándo es el próximo torneo, a qué hora y dónde verlo. Las horas siempre en horario de la Ciudad de México, para que nadie llegue tarde.

**🏆 Resultados** — el podio de cada torneo, con el personaje que usó cada quien. Se va acumulando: en un par de años vamos a tener el registro completo de la escena.

**👥 Jugadores** — el directorio de la comunidad. Cada quien con su perfil, sus estadísticas y su historial.

**📖 Tutoriales** — desde cómo instalar Fightcade hasta cómo entrar a tu primer torneo. Si nunca has jugado en línea, empieza por ahí.

## Regístrate

No cuesta nada y no hace falta ser bueno. Al crear tu cuenta apareces en el directorio y tus resultados se van sumando torneo tras torneo.

Usa el mismo nickname que en Fightcade: así te encuentran fácil cuando te vean jugando.

## Esto apenas empieza

Vienen más cosas: estadísticas, overlays para las transmisiones y votaciones en vivo. Si algo no funciona o se te ocurre cómo mejorarlo, dinos.

Nos vemos en el próximo torneo. 🔥

*— Qcho*
$md$
where slug = 'hello-world';


-- -----------------------------------------------------------------------------
-- Resultados de la 2ª edición
-- -----------------------------------------------------------------------------
update public.news set
  excerpt = 'KELA420 se llevó la 2da Edición de Super Turbo México. Repasamos cómo estuvo el torneo y quiénes subieron al podio.',
  body_md = $md$
🔥 **KELA420 se coronó como el REY DE LA FARMACIA** en la 2da Edición de Super Turbo México.

## Cómo estuvo

Segunda edición del circuito, con más gente que la primera y un nivel que subió de forma notoria. Los combates de la parte alta del cuadro estuvieron cerradísimos.

## El podio

Puedes ver las posiciones completas, con el personaje que usó cada jugador, en la sección de **🏆 Resultados**.

## Gracias a todos

A quienes jugaron, a quienes se conectaron a ver y a quienes ayudaron a organizar. Esto no existe sin la comunidad.

## El siguiente

La tercera edición se anuncia pronto. Está atento a la sección de **📅 Eventos** y regístrate en la página para que tus resultados queden guardados en tu perfil.

Nos vemos en la farmacia. 💊
$md$
where slug = 'kela420-se-corono-como-el-rey-de-la-farmacia-en-la-2da-edicion-de-super-turbo-mexico';


-- -----------------------------------------------------------------------------
-- Verificación
-- -----------------------------------------------------------------------------
select
  title,
  case when excerpt is null or btrim(excerpt) = '' then '❌ SIN RESUMEN' else '✅' end as resumen,
  length(body_md) as caracteres,
  status
from public.news
order by published_at desc;
