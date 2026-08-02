-- =============================================================================
-- 0002_catalogs.sql
-- SSF2X México — Tablas catálogo
-- =============================================================================
-- Catálogos: conjuntos estables de valores que necesitan metadatos y que un
-- administrador puede editar sin desplegar código. Por eso son tablas, no enums.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- characters — roster del juego
-- -----------------------------------------------------------------------------
-- IMPORTANTE (legal): esta tabla guarda únicamente NOMBRES y metadatos de
-- presentación. No almacena ni referencia sprites, retratos ni ningún material
-- con copyright. El avatar por personaje se genera por código en el cliente
-- (monograma SVG con el color asignado). icon_path queda disponible por si en
-- el futuro se encarga arte original propio del proyecto.
create table public.characters (
  id             smallint     primary key,
  slug           text         not null unique,
  name           text         not null,
  -- Color de identidad para el avatar generado y para acentos en la interfaz.
  color_hex      char(7)      not null default '#FFB000'
                              check (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  -- Iniciales mostradas en el avatar generado (1-2 caracteres).
  initials       text         not null check (char_length(initials) between 1 and 2),
  -- Ruta a arte ORIGINAL del proyecto, si algún día existe. Nunca material oficial.
  icon_path      text,
  display_order  smallint     not null default 0,
  is_active      boolean      not null default true,
  created_at     timestamptz  not null default now(),
  updated_at     timestamptz  not null default now()
);

comment on table public.characters is
  'Catálogo de personajes. Solo nombres y metadatos: sin material con copyright.';
comment on column public.characters.color_hex is
  'Color de identidad usado por el avatar generado por código.';

create index characters_active_order_idx
  on public.characters (display_order)
  where is_active;

create trigger characters_set_updated_at
  before update on public.characters
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- tutorial_categories — agrupación de guías
-- -----------------------------------------------------------------------------
create table public.tutorial_categories (
  id             smallint     generated always as identity primary key,
  slug           text         not null unique,
  name           text         not null,
  description    text,
  display_order  smallint     not null default 0,
  is_active      boolean      not null default true,
  created_at     timestamptz  not null default now(),
  updated_at     timestamptz  not null default now()
);

comment on table public.tutorial_categories is
  'Categorías de tutoriales (instalación, fundamentos, personajes, netplay...).';

create trigger tutorial_categories_set_updated_at
  before update on public.tutorial_categories
  for each row execute function public.set_updated_at();
