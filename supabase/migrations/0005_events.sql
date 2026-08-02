-- =============================================================================
-- 0005_events.sql
-- SSF2X México — Eventos, torneos y resultados
-- =============================================================================
-- Este es el corazón del proyecto. Es la información que no se puede rehacer:
-- un frontend se reescribe en un fin de semana, el historial de diez años de
-- torneos no. Por eso este archivo es el más conservador del esquema.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- events
-- -----------------------------------------------------------------------------
-- Todas las fechas son timestamptz (UTC internamente). La conversión a hora de
-- México ocurre solo al mostrar. Guardar horas "ingenuas" es la causa número uno
-- de torneos anunciados con la hora equivocada.
create table public.events (
  id                uuid                primary key default gen_random_uuid(),
  slug              text                not null unique,
  name              text                not null check (char_length(name) between 3 and 160),
  description_md    text,

  kind              public.event_kind   not null default 'tournament',
  mode              public.event_mode   not null default 'online',
  status            public.event_status not null default 'draft',

  starts_at         timestamptz         not null,
  ends_at           timestamptz,

  venue_name        text,
  venue_address     text,
  stream_url        text,
  registration_url  text,
  cover_path        text,
  max_participants  smallint            check (max_participants > 0),

  -- Válvula de escape para "información adicional" (reglas, premios, requisitos).
  -- REGLA: si un dato de aquí se necesita para filtrar, ordenar o estadística,
  -- deja de ser 'extra' y se promueve a columna real en una nueva migración.
  -- jsonb es para datos que solo se muestran.
  extra             jsonb               not null default '{}'::jsonb,

  created_by        uuid                references public.profiles (id) on delete set null,
  created_at        timestamptz         not null default now(),
  updated_at        timestamptz         not null default now(),

  constraint events_dates_coherent
    check (ends_at is null or ends_at > starts_at),

  -- Un evento presencial necesita sede; uno en línea, dónde verlo.
  constraint events_venue_required_when_presencial
    check (mode <> 'presencial' or venue_name is not null)
);

comment on table public.events is
  'Eventos de la comunidad. Los de kind=tournament admiten resultados.';
comment on column public.events.extra is
  'Datos de solo presentación. Si necesitas filtrar por un campo, promuévelo a columna.';

create index events_starts_at_idx     on public.events (starts_at desc);
create index events_status_starts_idx on public.events (status, starts_at);
create index events_kind_idx          on public.events (kind);

create trigger events_set_slug
  before insert or update on public.events
  for each row execute function public.set_slug_from('name');

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- event_results — posiciones finales
-- -----------------------------------------------------------------------------
-- DECISIÓN: una FILA POR POSICIÓN, no cuatro columnas fijas.
--
-- El requisito original pedía registrar del 1.º al 4.º lugar. Modelarlo como
-- columnas (first_place_id, second_place_id...) sería rígido: el día que se
-- quiera un top 8 habría que migrar la tabla con datos en producción. Con
-- filas, capturar cuatro hoy y ocho mañana no requiere ningún cambio.
--
-- player_id es NULLABLE a propósito. En la práctica sube al podio gente sin
-- cuenta en el sitio; sin guest_nickname habría que inventar un perfil falso o
-- perder el dato. Ninguna de las dos opciones es aceptable en un registro
-- histórico.
--
-- character_id se guarda POR RESULTADO, no se toma del perfil: el main de un
-- jugador cambia con los años, pero el personaje que usó en un torneo concreto
-- es un hecho histórico. Este campo es lo que hará posibles las estadísticas de
-- meta-juego de la Fase 3. Los datos que no se capturan hoy no existen mañana.
create table public.event_results (
  id             uuid        primary key default gen_random_uuid(),
  event_id       uuid        not null references public.events (id) on delete cascade,
  position       smallint    not null check (position > 0),

  player_id      uuid        references public.profiles (id) on delete set null,
  guest_nickname text        check (char_length(guest_nickname) between 2 and 40),

  character_id   smallint    references public.characters (id) on delete set null,
  notes          text        check (char_length(notes) <= 240),

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  -- Siempre hay alguien identificable en cada posición.
  constraint event_results_needs_identity
    check (player_id is not null or guest_nickname is not null),

  -- No puede haber dos primeros lugares en el mismo torneo.
  constraint event_results_unique_position unique (event_id, position)
);

comment on table public.event_results is
  'Posiciones finales por evento. Una fila por posición: soporta top 4, top 8 o bracket completo.';
comment on column public.event_results.guest_nickname is
  'Nickname de un jugador sin cuenta en el sitio. Evita perder datos históricos.';
comment on column public.event_results.character_id is
  'Personaje usado EN ESE TORNEO, no el main actual del perfil. Base de las estadísticas futuras.';

-- Un jugador registrado no puede ocupar dos posiciones en el mismo evento.
-- Índice parcial en lugar de UNIQUE porque player_id admite NULL y varios
-- invitados sí pueden convivir en el mismo torneo.
create unique index event_results_unique_player_per_event
  on public.event_results (event_id, player_id)
  where player_id is not null;

create index event_results_event_position_idx on public.event_results (event_id, position);
create index event_results_player_idx         on public.event_results (player_id);
create index event_results_character_idx      on public.event_results (character_id);

create trigger event_results_set_updated_at
  before update on public.event_results
  for each row execute function public.set_updated_at();


-- Los resultados solo tienen sentido en eventos terminados. Sin esta validación
-- aparecerían podios de torneos que aún no han ocurrido.
create or replace function public.validate_result_event_state()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.event_status;
  v_kind   public.event_kind;
begin
  select e.status, e.kind into v_status, v_kind
  from public.events e where e.id = new.event_id;

  if v_status is distinct from 'finished' then
    raise exception
      'Solo se pueden registrar resultados en eventos con estado finished (estado actual: %).',
      coalesce(v_status::text, 'inexistente');
  end if;

  if v_kind not in ('tournament', 'exhibition') then
    raise exception
      'Solo los eventos de tipo tournament o exhibition admiten resultados.';
  end if;

  return new;
end;
$$;

create trigger event_results_validate_event_state
  before insert or update on public.event_results
  for each row execute function public.validate_result_event_state();
