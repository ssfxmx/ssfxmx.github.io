-- =============================================================================
-- 0010_future_modules.sql
-- SSF2X México — Módulos preparados para fases posteriores
-- =============================================================================
-- Estas tablas se crean AHORA, vacías y con su RLS puesta, aunque no tengan
-- interfaz hasta la Fase 3.
--
-- ¿Por qué crearlas antes de usarlas? Porque agregar tablas relacionadas a una
-- base de datos vacía cuesta cinco minutos, y hacerlo con datos en producción y
-- usuarios conectados cuesta una ventana de mantenimiento. El coste de tenerlas
-- vacías es cero.
--
-- Lo que NO se hace aquí es adivinar campos que dependan de decisiones futuras.
-- Se modela solo lo que ya se sabe con certeza.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- overlays — configuración de overlays para OBS (Fase 3)
-- -----------------------------------------------------------------------------
-- El overlay se consume desde /overlay/:key como fuente de navegador en OBS.
-- Se identifica por 'key' y no por uuid para que la URL sea escribible a mano
-- por el streamer.
create table public.overlays (
  id          uuid        primary key default gen_random_uuid(),
  key         text        not null unique check (key ~ '^[a-z0-9\-]{3,40}$'),
  name        text        not null,
  type        text        not null default 'scoreboard',
  config      jsonb       not null default '{}'::jsonb,
  is_active   boolean     not null default false,
  created_by  uuid        references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.overlays is
  'Configuración de overlays de OBS. Se consume en /overlay/:key. Fase 3.';

create trigger overlays_set_updated_at
  before update on public.overlays
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- stream_state — estado en vivo del stream (Fase 3)
-- -----------------------------------------------------------------------------
-- Tabla de una sola fila (singleton). El overlay se suscribe por Realtime y se
-- actualiza sin recargar. El CHECK sobre id garantiza que no puedan existir dos
-- estados en conflicto.
create table public.stream_state (
  id             boolean     primary key default true check (id),
  event_id       uuid        references public.events (id) on delete set null,
  player1_label  text,
  player1_score  smallint    not null default 0 check (player1_score >= 0),
  player1_char_id smallint   references public.characters (id) on delete set null,
  player2_label  text,
  player2_score  smallint    not null default 0 check (player2_score >= 0),
  player2_char_id smallint   references public.characters (id) on delete set null,
  round_label    text,
  is_live        boolean     not null default false,
  updated_by     uuid        references public.profiles (id) on delete set null,
  updated_at     timestamptz not null default now()
);

comment on table public.stream_state is
  'Marcador en vivo, fila única. Los overlays se suscriben por Realtime. Fase 3.';

insert into public.stream_state (id) values (true) on conflict do nothing;

create trigger stream_state_set_updated_at
  before update on public.stream_state
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- polls / poll_options / poll_votes — votaciones en stream (Fase 3)
-- -----------------------------------------------------------------------------
-- AVISO ANTICIPADO: votar sin cuenta NO se puede asegurar solo con RLS, porque
-- nada impide a un script votar mil veces. Habrá dos caminos posibles:
--   (a) exigir sesión iniciada  → simple, RLS puro, ya soportado por user_id
--   (b) Edge Function + Turnstile → permite votar sin cuenta, usa fingerprint
-- El esquema soporta ambos: user_id es nullable y existe fingerprint. La
-- decisión se toma en Fase 3, no ahora.
create table public.polls (
  id          uuid        primary key default gen_random_uuid(),
  question    text        not null check (char_length(question) between 3 and 200),
  event_id    uuid        references public.events (id) on delete set null,
  is_open     boolean     not null default false,
  requires_auth boolean   not null default true,
  opens_at    timestamptz,
  closes_at   timestamptz,
  created_by  uuid        references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.poll_options (
  id            uuid     primary key default gen_random_uuid(),
  poll_id       uuid     not null references public.polls (id) on delete cascade,
  label         text     not null check (char_length(label) between 1 and 80),
  display_order smallint not null default 0
);

create table public.poll_votes (
  id           uuid        primary key default gen_random_uuid(),
  poll_id      uuid        not null references public.polls (id) on delete cascade,
  option_id    uuid        not null references public.poll_options (id) on delete cascade,
  user_id      uuid        references public.profiles (id) on delete cascade,
  -- Huella del navegador, solo para el modo sin autenticación.
  fingerprint  text,
  created_at   timestamptz not null default now(),

  constraint poll_votes_needs_identity
    check (user_id is not null or fingerprint is not null)
);

-- Un voto por usuario autenticado y por encuesta.
create unique index poll_votes_unique_user
  on public.poll_votes (poll_id, user_id)
  where user_id is not null;

-- Mitigación (no garantía) para el modo anónimo.
create unique index poll_votes_unique_fingerprint
  on public.poll_votes (poll_id, fingerprint)
  where user_id is null and fingerprint is not null;

create index poll_options_poll_idx on public.poll_options (poll_id, display_order);
create index poll_votes_poll_idx   on public.poll_votes (poll_id, option_id);

create trigger polls_set_updated_at
  before update on public.polls
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- matches — combates individuales (Fase 3)
-- -----------------------------------------------------------------------------
-- La Fase 1 registra solo posiciones finales, tal como se pidió. Esta tabla
-- queda lista por si algún día se registra el bracket completo. No interfiere
-- con event_results: son dos niveles de detalle independientes.
create table public.matches (
  id              uuid        primary key default gen_random_uuid(),
  event_id        uuid        not null references public.events (id) on delete cascade,
  round_label     text,
  match_order     smallint,
  player1_id      uuid        references public.profiles (id) on delete set null,
  player1_guest   text,
  player1_char_id smallint    references public.characters (id) on delete set null,
  player1_score   smallint    check (player1_score >= 0),
  player2_id      uuid        references public.profiles (id) on delete set null,
  player2_guest   text,
  player2_char_id smallint    references public.characters (id) on delete set null,
  player2_score   smallint    check (player2_score >= 0),
  vod_url         text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index matches_event_idx on public.matches (event_id, match_order);

create trigger matches_set_updated_at
  before update on public.matches
  for each row execute function public.set_updated_at();


-- =============================================================================
-- RLS de los módulos futuros
-- =============================================================================
-- Se activa desde ahora. Una tabla sin RLS en Supabase es una tabla abierta al
-- mundo: dejarlas "para después" es exactamente el descuido que provoca fugas.
alter table public.overlays      enable row level security;
alter table public.stream_state  enable row level security;
alter table public.polls         enable row level security;
alter table public.poll_options  enable row level security;
alter table public.poll_votes    enable row level security;
alter table public.matches       enable row level security;

create policy overlays_select_public on public.overlays for select
  to anon, authenticated using (is_active or (select public.is_admin()));
create policy overlays_admin_all on public.overlays for all
  to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy stream_state_select_public on public.stream_state for select
  to anon, authenticated using (true);
create policy stream_state_admin_write on public.stream_state for update
  to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy polls_select_public on public.polls for select
  to anon, authenticated using (is_open or (select public.is_admin()));
create policy polls_admin_all on public.polls for all
  to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy poll_options_select_public on public.poll_options for select
  to anon, authenticated using (
    exists (select 1 from public.polls p where p.id = poll_options.poll_id and p.is_open)
    or (select public.is_admin())
  );
create policy poll_options_admin_all on public.poll_options for all
  to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Los votos individuales no son públicos: el sitio muestra agregados.
create policy poll_votes_insert_authenticated on public.poll_votes for insert
  to authenticated with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.polls p where p.id = poll_id and p.is_open)
  );
create policy poll_votes_select_own on public.poll_votes for select
  to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy matches_select_public on public.matches for select
  to anon, authenticated using (
    exists (select 1 from public.events e where e.id = matches.event_id and e.status <> 'draft')
  );
create policy matches_admin_all on public.matches for all
  to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

grant select on public.overlays, public.stream_state, public.polls,
                public.poll_options, public.matches
  to anon, authenticated;
grant select, insert on public.poll_votes to authenticated;
grant insert, update, delete on public.overlays, public.polls, public.poll_options,
                                public.matches to authenticated;
grant update on public.stream_state to authenticated;
