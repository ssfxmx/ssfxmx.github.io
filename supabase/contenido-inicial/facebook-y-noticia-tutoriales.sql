-- =============================================================================
-- Facebook de la comunidad + noticia invitando a los tutoriales
-- =============================================================================
-- Se puede ejecutar varias veces sin duplicar nada.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Enlace de Facebook
-- -----------------------------------------------------------------------------
-- Se fusiona con el objeto existente en lugar de sobrescribirlo (el operador ||
-- de jsonb), así que las demás redes conservan su valor aunque hoy estén
-- vacías. Aparecerá como icono en el pie del sitio.
update public.site_settings
set value = coalesce(value, '{}'::jsonb)
            || '{"facebook": "https://www.facebook.com/streetfighter2mexico"}'::jsonb
where key = 'social.links';


-- -----------------------------------------------------------------------------
-- 2. Noticia: invitación a los tutoriales
-- -----------------------------------------------------------------------------
insert into public.news (
  slug, title, excerpt, body_md, status, is_featured, author_id
) values (
  'guias-para-empezar',
  '📖 ¿Nunca has jugado en línea? Empieza por aquí',
  'Publicamos tres guías: cómo instalar Fightcade, cómo entrar a un torneo y qué está pasando en pantalla si solo quieres ver.',
  $md$
Una de las preguntas que más nos llega es la misma: *"quiero jugar, pero no sé por dónde empezar"*.

Ya no hay pretexto. Publicamos tres guías en la sección de **📖 Tutoriales**, según dónde estés parado.

## Si quieres jugar y no sabes cómo

**Cómo instalar Fightcade** te lleva de cero a tu primera partida en unos veinte minutos. Descarga, cuenta, configuración de controles y qué hacer cuando algo no jala: el antivirus que se queja, el cortafuegos que bloquea, el mando que no responde.

No necesitas palanca. Hay gente muy buena jugando en teclado.

## Si ya juegas y quieres competir

**Cómo participar en un torneo** explica qué necesitas antes, qué pasa el día del torneo y cómo comportarse. También responde lo que todos preguntan pero pocos se atreven: no, no hace falta ser bueno, y no, no cuesta nada.

La mitad de los que entran pierden sus primeros combates. Así empezamos todos.

## Si solo te gusta ver

**Guía para espectadores** es para quien nunca ha tocado el juego. Explica qué está pasando en pantalla, por qué la gente grita en ciertos momentos y qué es eso del juego de piernas, que es lo que menos se nota al principio y lo que más define el nivel.

Buena parte de la comunidad llegó primero mirando.

## ¿Falta alguna?

Si hay algo que te habría gustado que alguien te explicara cuando empezaste, dinos y la escribimos.

Nos vemos en el próximo torneo. 🔥
$md$,
  'published',
  true,
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
)
on conflict (slug) do update set
  title = excluded.title,
  excerpt = excluded.excerpt,
  body_md = excluded.body_md,
  is_featured = excluded.is_featured;


-- -----------------------------------------------------------------------------
-- Verificación
-- -----------------------------------------------------------------------------
select 'redes' as que, value::text as valor from public.site_settings where key = 'social.links'
union all
select 'noticias publicadas', count(*)::text from public.news where status = 'published';
