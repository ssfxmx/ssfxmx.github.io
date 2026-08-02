-- =============================================================================
-- Ajuste para el logotipo configurable
-- =============================================================================
-- Crea la clave donde se guarda la ruta del logotipo subido desde el panel.
--
-- Empieza vacía a propósito: mientras no haya nada subido, el sitio usa el
-- logotipo que viene con el proyecto en /logo.webp. Así nunca queda un hueco,
-- ni siquiera si alguien borra el archivo del almacenamiento.
--
-- Se puede ejecutar varias veces sin problema.
-- =============================================================================

insert into public.site_settings (key, value, description, is_public)
values (
  'site.logo_path',
  '""'::jsonb,
  'Ruta del logotipo dentro del bucket media. Vacío = se usa el logotipo por defecto del proyecto.',
  true
)
on conflict (key) do nothing;

select key, value::text, description from public.site_settings where key = 'site.logo_path';
