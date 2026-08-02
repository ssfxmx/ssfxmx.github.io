-- =============================================================================
-- 0012_highlights.sql
-- SSF2X México — Highlights (clips y videos de la comunidad)
-- =============================================================================
-- Publica enlaces a combates memorables alojados en redes sociales.
--
-- DECISIÓN: no se alojan videos propios.
-- Subir video a Storage consumiría el plan gratuito en pocas semanas y obligaría
-- a resolver transcodificación, miniaturas y reproducción adaptativa. La
-- comunidad ya sube sus clips a YouTube, Twitch o X; aquí solo se curan y se
-- ordenan. El sitio guarda el enlace, no el archivo.
--
-- La plataforma y el identificador del video se detectan al pegar la URL en el
-- panel, pero se GUARDAN en la base. Así, si mañana cambia la forma de las URL
-- de algún servicio, los highlights viejos siguen funcionando sin depender de
-- que el navegador vuelva a interpretarlas.
-- =============================================================================

create table public.highlights (
  id            uuid                  primary key default gen_random_uuid(),
  slug          text                  not null unique,
  title         text                  not null check (char_length(title) between 3 and 160),
  description   text                  check (char_length(description) <= 500),

  -- Enlace original, tal como lo pegó quien publica.
  url           text                  not null check (url ~* '^https?://'),

  -- Servicio detectado. Se usa text con CHECK y no un enum porque la lista de
  -- redes cambia más rápido que el resto del esquema y añadir una debe ser
  -- trivial.
  platform      text                  not null default 'other'
                                      check (platform in (
                                        'youtube', 'twitch', 'x', 'facebook',
                                        'tiktok', 'instagram', 'kick', 'other'
                                      )),

  -- Identificador del video dentro de esa plataforma, cuando se puede incrustar.
  embed_id      text,

  -- Miniatura. En YouTube se deduce del identificador; en el resto se puede
  -- subir una al bucket `media` o dejarla vacía.
  thumbnail_url text,

  -- Torneo al que pertenece el clip, si aplica. ON DELETE SET NULL: borrar un
  -- evento no debe llevarse por delante el video.
  event_id      uuid                  references public.events (id) on delete set null,

  status        public.content_status not null default 'draft',
  published_at  timestamptz,
  is_featured   boolean               not null default false,
  display_order smallint              not null default 0,

  created_by    uuid                  references public.profiles (id) on delete set null,
  created_at    timestamptz           not null default now(),
  updated_at    timestamptz           not null default now(),

  constraint highlights_published_needs_date
    check (status <> 'published' or published_at is not null)
);

comment on table public.highlights is
  'Clips y videos de la comunidad alojados en redes. Se guarda el enlace, nunca el archivo.';
comment on column public.highlights.platform is
  'Servicio detectado al pegar la URL. Se persiste para no depender de volver a interpretarla.';
comment on column public.highlights.embed_id is
  'Identificador del video en su plataforma. Nulo cuando el servicio no permite incrustar.';

create index highlights_public_listing_idx
  on public.highlights (published_at desc)
  where status = 'published';

create index highlights_event_idx on public.highlights (event_id);
create index highlights_platform_idx on public.highlights (platform);

create trigger highlights_set_slug
  before insert or update on public.highlights
  for each row execute function public.set_slug_from('title');

create trigger highlights_set_published_at
  before insert or update on public.highlights
  for each row execute function public.set_published_at();

create trigger highlights_set_updated_at
  before update on public.highlights
  for each row execute function public.set_updated_at();

create trigger highlights_audit
  after insert or update or delete on public.highlights
  for each row execute function public.log_audit();


-- -----------------------------------------------------------------------------
-- Seguridad
-- -----------------------------------------------------------------------------
alter table public.highlights enable row level security;

create policy highlights_select_published
  on public.highlights for select
  to anon, authenticated
  using (status = 'published' and published_at <= now());

create policy highlights_select_admin
  on public.highlights for select
  to authenticated
  using ((select public.is_admin()));

create policy highlights_admin_write
  on public.highlights for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant select on public.highlights to anon, authenticated;
grant insert, update, delete on public.highlights to authenticated;


-- -----------------------------------------------------------------------------
-- Vista pública con el evento ya resuelto
-- -----------------------------------------------------------------------------
create or replace view public.highlights_public
with (security_invoker = true) as
select
  h.id, h.slug, h.title, h.description, h.url, h.platform, h.embed_id,
  h.thumbnail_url, h.published_at, h.is_featured, h.display_order,
  h.event_id,
  e.slug as event_slug,
  e.name as event_name,
  e.starts_at as event_date
from public.highlights h
left join public.events e on e.id = h.event_id and e.status <> 'draft'
where h.status = 'published';

comment on view public.highlights_public is
  'Highlights publicados con el nombre del torneo ya resuelto.';

grant select on public.highlights_public to anon, authenticated;
