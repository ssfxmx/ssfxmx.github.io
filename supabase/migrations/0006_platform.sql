-- =============================================================================
-- 0006_platform.sql
-- SSF2X México — Configuración del sitio y auditoría
-- =============================================================================

-- -----------------------------------------------------------------------------
-- site_settings — configuración editable sin desplegar
-- -----------------------------------------------------------------------------
-- Un registro por opción. Evita hardcodear textos, redes sociales o enlaces de
-- stream en el frontend: cambiarlos no debería requerir un despliegue.
--
-- is_public separa lo que cualquiera puede leer (redes, textos) de lo que solo
-- ve el administrador (claves de integración, banderas internas).
create table public.site_settings (
  key         text        primary key check (key ~ '^[a-z0-9_.]+$'),
  value       jsonb       not null default '{}'::jsonb,
  description text,
  is_public   boolean     not null default true,
  updated_by  uuid        references public.profiles (id) on delete set null,
  updated_at  timestamptz not null default now()
);

comment on table public.site_settings is
  'Configuración del sitio en clave/valor. is_public define si el anónimo puede leerla.';

create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- audit_log — trazabilidad de acciones administrativas
-- -----------------------------------------------------------------------------
-- No estaba en los requisitos originales. Se incluye porque en comunidades con
-- varios administradores aparece tarde o temprano la pregunta "¿quién cambió
-- esto?", y no poder responderla genera conflictos. Cuesta un trigger.
create table public.audit_log (
  id         bigint      generated always as identity primary key,
  actor_id   uuid        references public.profiles (id) on delete set null,
  action     text        not null,
  entity     text        not null,
  entity_id  text,
  diff       jsonb,
  created_at timestamptz not null default now()
);

comment on table public.audit_log is
  'Registro de cambios en entidades administrables. Solo lectura, y solo para administradores.';

create index audit_log_created_at_idx on public.audit_log (created_at desc);
create index audit_log_entity_idx     on public.audit_log (entity, entity_id);
create index audit_log_actor_idx      on public.audit_log (actor_id);


create or replace function public.log_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id text;
begin
  v_id := coalesce(to_jsonb(new) ->> 'id', to_jsonb(old) ->> 'id');

  insert into public.audit_log (actor_id, action, entity, entity_id, diff)
  values (
    (select auth.uid()),
    lower(tg_op),
    tg_table_name,
    v_id,
    case tg_op
      when 'INSERT' then jsonb_build_object('after',  to_jsonb(new))
      when 'DELETE' then jsonb_build_object('before', to_jsonb(old))
      else jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new))
    end
  );

  return coalesce(new, old);
end;
$$;

comment on function public.log_audit() is
  'Trigger AFTER: escribe el cambio en audit_log con el usuario responsable.';

-- Se audita todo lo que un administrador puede modificar.
-- profile_private NO se audita: guardaría datos personales duplicados en el log,
-- lo que contradice el diseño de privacidad de la migración 0003.
create trigger news_audit
  after insert or update or delete on public.news
  for each row execute function public.log_audit();

create trigger events_audit
  after insert or update or delete on public.events
  for each row execute function public.log_audit();

create trigger event_results_audit
  after insert or update or delete on public.event_results
  for each row execute function public.log_audit();

create trigger tutorials_audit
  after insert or update or delete on public.tutorials
  for each row execute function public.log_audit();

create trigger site_settings_audit
  after insert or update or delete on public.site_settings
  for each row execute function public.log_audit();


-- En profiles solo se auditan los cambios sensibles (rol y estado). Auditar cada
-- vez que alguien cambia su ciudad llenaría el log de ruido sin valor.
create or replace function public.log_profile_privileged_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     or new.status is distinct from old.status then
    insert into public.audit_log (actor_id, action, entity, entity_id, diff)
    values (
      (select auth.uid()),
      'privileged_update',
      'profiles',
      new.id::text,
      jsonb_build_object(
        'before', jsonb_build_object('role', old.role, 'status', old.status),
        'after',  jsonb_build_object('role', new.role, 'status', new.status)
      )
    );
  end if;
  return new;
end;
$$;

create trigger profiles_audit_privileged
  after update on public.profiles
  for each row execute function public.log_profile_privileged_change();
