# Esquema de base de datos — SSF2X México

Fuente de verdad del esquema. **Ninguna tabla se crea desde el panel de Supabase**: todo cambio pasa por un archivo de migración versionado en Git. Sin esta regla, en un año nadie sabrá por qué existe una columna.

## Orden de aplicación

Cada archivo depende de los anteriores. No se pueden reordenar.

| # | Archivo | Contenido |
|---|---|---|
| 1 | `0001_foundation.sql` | Enums y funciones auxiliares (`set_updated_at`, `slugify`, `set_slug_from`) |
| 2 | `0002_catalogs.sql` | `characters`, `tutorial_categories` |
| 3 | `0003_profiles.sql` | `profiles`, `profile_private`, `is_admin()`, triggers de registro y protección de roles |
| 4 | `0004_content.sql` | `news`, `tutorials` |
| 5 | `0005_events.sql` | `events`, `event_results` |
| 6 | `0006_platform.sql` | `site_settings`, `audit_log` y sus triggers |
| 7 | `0007_views.sql` | Vistas públicas |
| 8 | `0008_rls.sql` | Row Level Security y privilegios |
| 9 | `0009_storage.sql` | Buckets `avatars` y `media` |
| 10 | `0010_future_modules.sql` | Overlays, stream, votaciones y combates (Fase 3, tablas vacías) |
| — | `seed.sql` | 17 personajes, categorías de tutoriales, configuración inicial |

## Decisiones que conviene no revertir sin pensarlo

**Los datos personales viven en `profile_private`, no en `profiles`.** RLS filtra filas, no columnas. Si el nombre real y la fecha de nacimiento estuvieran junto a los datos públicos, cualquier política que permita ver perfiles ajenos los expondría. Separándolos, la privacidad es estructural y no depende del código de la interfaz. El correo ni siquiera se copia: vive solo en `auth.users`.

**`is_admin()` es `SECURITY DEFINER` por necesidad, no por comodidad.** Si una política sobre `profiles` consultara `profiles` para averiguar el rol, PostgreSQL entraría en recursión infinita de RLS y la tabla quedaría inaccesible. Es el error más común al implementar roles en Supabase.

**Los resultados son una fila por posición, no cuatro columnas.** Permite pasar de top 4 a top 8 sin migrar datos en producción. `player_id` es nullable y existe `guest_nickname` porque en la práctica sube al podio gente sin cuenta en el sitio.

**`event_results.character_id` se guarda por resultado, no se toma del perfil.** El main de un jugador cambia con los años; el personaje que usó en un torneo concreto es un hecho histórico. Sin este campo, las estadísticas de meta-juego de la Fase 3 serían imposibles y el dato ya no se podría recuperar.

**Las vistas usan `security_invoker = true`.** Con la opción por defecto se ejecutarían con permisos del propietario y podrían saltarse RLS en silencio.

**Todas las fechas son `timestamptz`.** Guardar horas sin zona es la causa número uno de torneos anunciados con la hora equivocada. La conversión a hora de México ocurre solo al mostrar.

## Verificación realizada

El esquema completo se aplicó y probó contra PostgreSQL 16 antes de entregarse. Pruebas ejecutadas:

- Alta de usuario → creación automática de perfil y de su fila privada
- Colisión de nickname resuelta con sufijo, respetando la capitalización elegida
- Autopromoción a administrador: **bloqueada** (el trigger revierte el cambio)
- Edición de perfil ajeno: **bloqueada** por RLS (0 filas afectadas)
- Jugador intentando publicar noticias: **bloqueado** por privilegios
- Degradación del último administrador: **bloqueada** con excepción explícita
- Anónimo leyendo `profile_private` y `audit_log`: **denegado**
- Anónimo escribiendo en `news` y `events`: **denegado**
- Borradores de noticias y eventos: invisibles para el público, visibles para el admin
- Resultados en eventos no finalizados: **rechazados**
- Dos primeros lugares en el mismo torneo: **rechazados**
- Generación de slug, vistas de estadísticas y resultados públicos: correctas

Dos fallos detectados durante esa verificación y ya corregidos:

1. El bootstrap del primer administrador no funcionaba: el trigger de protección revertía el `UPDATE` porque en una conexión SQL directa no hay `auth.uid()`. Corregido con una excepción acotada y documentada en `0003_profiles.sql`.
2. Los nicknames se guardaban en minúsculas porque se les aplicaba `slugify`. Ahora se conserva la capitalización; la unicidad insensible a mayúsculas la garantiza el índice sobre `lower(nickname)`.

## Convención para cambios futuros

1. Crear un archivo nuevo (`0011_...sql`), **nunca editar uno ya aplicado**
2. Comentar el *por qué* del cambio, no el *qué*
3. Si la tabla es nueva: activar RLS y definir sus políticas en la misma migración
4. Regenerar los tipos de TypeScript: `supabase gen types typescript --linked > src/shared/types/database.ts`

## Primer administrador

Ver instrucciones al final de `seed.sql`. Se hace una sola vez, por SQL directo, y es el único camino para obtener el rol.
