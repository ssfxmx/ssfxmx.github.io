-- =============================================================================
-- 0004_content.sql
-- SSF2X México — Noticias y tutoriales
-- =============================================================================
-- El cuerpo del contenido se almacena en Markdown (body_md), no en HTML.
-- Razón: es portable, versionable, legible en crudo y no queda atado al editor
-- que se use hoy. El HTML generado por un WYSIWYG envejece mal y migrarlo
-- dentro de cinco años sería doloroso.
--
-- Aunque solo los administradores escriben contenido, el Markdown se sanitiza
-- al renderizar (sin HTML crudo) por defensa en profundidad.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- news — noticias de la comunidad
-- -----------------------------------------------------------------------------
create table public.news (
  id            uuid                  primary key default gen_random_uuid(),
  slug          text                  not null unique,
  title         text                  not null check (char_length(title) between 3 and 160),
  excerpt       text                  check (char_length(excerpt) <= 320),
  body_md       text                  not null,
  cover_path    text,
  status        public.content_status not null default 'draft',
  published_at  timestamptz,
  is_featured   boolean               not null default false,
  view_count    integer               not null default 0,
  author_id     uuid                  references public.profiles (id) on delete set null,
  created_at    timestamptz           not null default now(),
  updated_at    timestamptz           not null default now(),

  -- Una noticia publicada siempre tiene fecha de publicación. Sin esta
  -- restricción aparecerían noticias sin fecha en el listado cronológico.
  constraint news_published_needs_date
    check (status <> 'published' or published_at is not null)
);

comment on table public.news is 'Noticias de la comunidad en orden cronológico.';
comment on column public.news.is_featured is 'Destaca la noticia en la portada.';

-- Índice del listado público: filtra por estado y ordena por fecha.
create index news_public_listing_idx
  on public.news (published_at desc)
  where status = 'published';

create index news_author_idx on public.news (author_id);

create trigger news_set_slug
  before insert or update on public.news
  for each row execute function public.set_slug_from('title');

create trigger news_set_updated_at
  before update on public.news
  for each row execute function public.set_updated_at();


-- Fija published_at automáticamente la primera vez que se publica.
-- Evita el error humano de publicar con una fecha equivocada.
create or replace function public.set_published_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create trigger news_set_published_at
  before insert or update on public.news
  for each row execute function public.set_published_at();


-- -----------------------------------------------------------------------------
-- tutorials — guías (la primera será "Cómo instalar Fightcade")
-- -----------------------------------------------------------------------------
create table public.tutorials (
  id             uuid                  primary key default gen_random_uuid(),
  slug           text                  not null unique,
  title          text                  not null check (char_length(title) between 3 and 160),
  summary        text                  check (char_length(summary) <= 320),
  body_md        text                  not null,
  category_id    smallint              references public.tutorial_categories (id)
                                       on delete set null,
  -- 1 = principiante, 2 = intermedio, 3 = avanzado
  difficulty     smallint              not null default 1 check (difficulty between 1 and 3),
  estimated_min  smallint              check (estimated_min > 0),
  cover_path     text,
  status         public.content_status not null default 'draft',
  published_at   timestamptz,
  display_order  smallint              not null default 0,
  author_id      uuid                  references public.profiles (id) on delete set null,
  created_at     timestamptz           not null default now(),
  updated_at     timestamptz           not null default now(),

  constraint tutorials_published_needs_date
    check (status <> 'published' or published_at is not null)
);

comment on table public.tutorials is
  'Guías de la comunidad. display_order permite un orden pedagógico, no cronológico.';

create index tutorials_public_listing_idx
  on public.tutorials (category_id, display_order)
  where status = 'published';

create trigger tutorials_set_slug
  before insert or update on public.tutorials
  for each row execute function public.set_slug_from('title');

create trigger tutorials_set_published_at
  before insert or update on public.tutorials
  for each row execute function public.set_published_at();

create trigger tutorials_set_updated_at
  before update on public.tutorials
  for each row execute function public.set_updated_at();
