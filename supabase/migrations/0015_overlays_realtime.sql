-- =============================================================================
-- 0015_overlays_realtime.sql
-- SSF2X México — Overlays para OBS
-- =============================================================================
-- Las tablas overlays y stream_state existen desde la migración 0010, creadas
-- vacías a propósito. Aquí se completan con lo que hacía falta para usarlas:
--
--   1. Publicación en Realtime, para que el marcador cambie en OBS sin recargar
--   2. Campos de presentación que la primera versión no contemplaba
--   3. Un overlay por defecto, para que haya algo que capturar desde el minuto
--      uno sin tener que crearlo a mano
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Realtime
-- -----------------------------------------------------------------------------
-- Sin esto, la página del overlay tendría que preguntar por cambios cada pocos
-- segundos: se vería el marcador saltar con retraso, justo cuando más se nota.
--
-- El bloque comprueba que la publicación exista para que el archivo también
-- pueda ejecutarse en un PostgreSQL normal, donde `supabase_realtime` no está.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'stream_state'
    ) then
      alter publication supabase_realtime add table public.stream_state;
    end if;
  end if;
end $$;

-- Realtime necesita la fila completa en cada cambio. Sin REPLICA IDENTITY FULL
-- solo llegarían las columnas de la llave primaria y el overlay recibiría
-- avisos vacíos.
alter table public.stream_state replica identity full;


-- -----------------------------------------------------------------------------
-- 2. Campos de presentación
-- -----------------------------------------------------------------------------
alter table public.stream_state
  add column if not exists tournament_label text,
  add column if not exists show_characters  boolean not null default true,
  add column if not exists best_of          smallint not null default 3
    check (best_of in (1, 3, 5, 7));

comment on column public.stream_state.tournament_label is
  'Texto superior del marcador: "Rey de la Farmacia #3", "Top 8"...';
comment on column public.stream_state.best_of is
  'Formato del set. Se usa para dibujar los indicadores de rondas ganadas.';


-- -----------------------------------------------------------------------------
-- 3. Overlay por defecto
-- -----------------------------------------------------------------------------
-- La clave es legible a propósito: el streamer escribe la dirección a mano en
-- OBS y un identificador aleatorio sería un suplicio de teclear.
insert into public.overlays (key, name, type, config, is_active)
values (
  'marcador',
  'Marcador principal',
  'scoreboard',
  '{"position": "top", "size": "medium"}'::jsonb,
  true
)
on conflict (key) do nothing;


-- -----------------------------------------------------------------------------
-- Verificación
-- -----------------------------------------------------------------------------
select
  (select count(*) from public.overlays)      as overlays,
  (select count(*) from public.stream_state)  as filas_de_estado,
  (select relreplident from pg_class where relname = 'stream_state') as replica_identity;
