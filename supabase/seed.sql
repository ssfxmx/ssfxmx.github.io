-- =============================================================================
-- seed.sql
-- SSF2X México — Datos iniciales
-- =============================================================================
-- Idempotente: se puede ejecutar varias veces sin duplicar nada.
--
-- NOTA LEGAL: solo se guardan nombres, iniciales y un color de identidad
-- elegido para la interfaz. No hay sprites, retratos ni ningún material con
-- copyright. El avatar por personaje se dibuja por código en el navegador como
-- monograma SVG usando 'initials' y 'color_hex'.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Personajes — roster de Super Street Fighter II X (17)
-- -----------------------------------------------------------------------------
insert into public.characters (id, slug, name, initials, color_hex, display_order) values
  ( 1, 'ryu',      'Ryu',       'RY', '#E8E8F0',  1),
  ( 2, 'ken',      'Ken',       'KE', '#FF3B30',  2),
  ( 3, 'chun-li',  'Chun-Li',   'CH', '#3B82F6',  3),
  ( 4, 'guile',    'Guile',     'GU', '#4ADE80',  4),
  ( 5, 'blanka',   'Blanka',    'BL', '#22C55E',  5),
  ( 6, 'zangief',  'Zangief',   'ZA', '#B91C1C',  6),
  ( 7, 'dhalsim',  'Dhalsim',   'DH', '#F97316',  7),
  ( 8, 'e-honda',  'E. Honda',  'EH', '#EC4899',  8),
  ( 9, 'balrog',   'Balrog',    'BA', '#7C3AED',  9),
  (10, 'vega',     'Vega',      'VE', '#A855F7', 10),
  (11, 'sagat',    'Sagat',     'SA', '#EAB308', 11),
  (12, 'm-bison',  'M. Bison',  'MB', '#DC2626', 12),
  (13, 'cammy',    'Cammy',     'CA', '#10B981', 13),
  (14, 'fei-long', 'Fei Long',  'FL', '#F59E0B', 14),
  (15, 'dee-jay',  'Dee Jay',   'DJ', '#06B6D4', 15),
  (16, 't-hawk',   'T. Hawk',   'TH', '#EA580C', 16),
  (17, 'akuma',    'Akuma',     'AK', '#9333EA', 17)
on conflict (id) do update
  set slug          = excluded.slug,
      name          = excluded.name,
      initials      = excluded.initials,
      color_hex     = excluded.color_hex,
      display_order = excluded.display_order;


-- -----------------------------------------------------------------------------
-- Categorías de tutoriales
-- -----------------------------------------------------------------------------
insert into public.tutorial_categories (slug, name, description, display_order) values
  ('instalacion', 'Instalación',
   'Cómo dejar todo listo para jugar en línea.', 1),
  ('fundamentos', 'Fundamentos',
   'Conceptos básicos: espaciamiento, defensa, ejecución.', 2),
  ('personajes',  'Personajes',
   'Guías específicas por personaje.', 3),
  ('netplay',     'Juego en línea',
   'Netcode, retraso, configuración de red y buenas prácticas.', 4),
  ('competitivo', 'Competitivo',
   'Reglas de torneo, formatos y preparación.', 5)
on conflict (slug) do update
  set name          = excluded.name,
      description   = excluded.description,
      display_order = excluded.display_order;


-- -----------------------------------------------------------------------------
-- Configuración inicial del sitio
-- -----------------------------------------------------------------------------
insert into public.site_settings (key, value, description, is_public) values
  ('site.title',
   '"SSF2X México"'::jsonb,
   'Título del sitio.', true),

  ('site.tagline',
   '"La comunidad mexicana de Super Street Fighter II X"'::jsonb,
   'Lema mostrado en la portada.', true),

  ('site.contact_email',
   '"ssfxmx@gmail.com"'::jsonb,
   'Correo de contacto público.', true),

  ('social.links',
   '{"discord": "", "youtube": "", "twitch": "", "x": "", "facebook": ""}'::jsonb,
   'Redes sociales de la comunidad. Las vacías no se muestran.', true),

  ('home.hero_text',
   '"Torneos mensuales, resultados y comunidad. Desde 1994, seguimos jugando."'::jsonb,
   'Texto principal de la portada.', true),

  ('events.default_timezone',
   '"America/Mexico_City"'::jsonb,
   'Zona horaria mostrada en eventos. Las fechas se guardan siempre en UTC.', true),

  ('registration.enabled',
   'true'::jsonb,
   'Permite cerrar el registro sin desplegar código si hubiera abuso.', true),

  ('features.captcha_enabled',
   'false'::jsonb,
   'Bandera para activar CAPTCHA en Fase 2 sin tocar el código.', false)
on conflict (key) do nothing;


-- =============================================================================
-- PRIMER ADMINISTRADOR — se hace a mano, y a propósito
-- =============================================================================
-- El rol de administrador no se puede obtener desde la aplicación por ningún
-- camino. El primero se asigna aquí, una sola vez:
--
--   1) Regístrate normalmente en el sitio con ssfxmx@gmail.com
--   2) Confirma el correo
--   3) Ejecuta esto en el SQL Editor de Supabase:
--
--        update public.profiles
--        set role = 'admin'
--        where id = (select id from auth.users where email = 'ssfxmx@gmail.com');
--
--   4) Comprueba que funcionó:
--
--        select nickname, role from public.profiles where role = 'admin';
--
-- A partir de ahí, los siguientes administradores se promueven desde el panel,
-- y cada promoción queda registrada en audit_log.
-- =============================================================================
