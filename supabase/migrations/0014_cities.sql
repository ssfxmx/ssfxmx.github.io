-- =============================================================================
-- 0014_cities.sql
-- SSF2X México — Catálogo de ciudades
-- =============================================================================
-- EL PROBLEMA QUE RESUELVE
--
-- La ciudad era texto libre. Con diez personas registradas ya habría "CDMX",
-- "Ciudad de México", "cdmx" y "Distrito Federal" conviviendo como si fueran
-- cuatro lugares distintos. El filtro del directorio construía sus opciones
-- leyendo los valores existentes, así que cada variante aparecía por separado,
-- y cualquier estadística por escena local habría sido imposible sin limpiar
-- los datos a mano.
--
-- CÓMO QUEDA
--
--   profiles.city_id      → referencia al catálogo (el caso normal)
--   profiles.city_custom  → texto libre, solo para quien eligió "Otro"
--
-- La vista pública devuelve una sola columna `city` con lo que corresponda, así
-- que el frontend sigue leyendo un único campo y no tiene que decidir nada.
--
-- Cuando varias personas escriban la misma ciudad en "Otro", el administrador
-- la promueve al catálogo desde el panel y deja de ser texto suelto. Ese es el
-- mecanismo que mantiene los datos limpios sin que nadie tenga que vigilarlos.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Catálogo
-- -----------------------------------------------------------------------------
create table public.cities (
  id            smallint    generated always as identity primary key,
  name          text        not null,
  state         text        not null,
  country_code  char(2)     not null default 'MX',

  -- Formas alternativas de escribir la ciudad. Sirven para reconocer lo que ya
  -- había escrito la gente y para que el buscador encuentre "CDMX" cuando la
  -- ciudad se llama "Ciudad de México".
  aliases       text[]      not null default '{}',

  display_order smallint    not null default 0,
  is_active     boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint cities_unique_name_state unique (name, state)
);

comment on table public.cities is
  'Ciudades disponibles en el registro. Editable desde el panel para no depender de un despliegue.';
comment on column public.cities.aliases is
  'Formas alternativas de escribir el nombre. Se usan para reconocer texto libre y para buscar.';

create index cities_active_idx on public.cities (state, name) where is_active;

create trigger cities_set_updated_at
  before update on public.cities
  for each row execute function public.set_updated_at();

alter table public.cities enable row level security;

create policy cities_select_public
  on public.cities for select
  to anon, authenticated
  using (is_active or (select public.is_admin()));

create policy cities_admin_all
  on public.cities for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant select on public.cities to anon, authenticated;
grant insert, update, delete on public.cities to authenticated;


-- -----------------------------------------------------------------------------
-- Semilla
-- -----------------------------------------------------------------------------
-- Se siembran las ciudades grandes de cada estado, no las 2 400 del país: una
-- lista inmanejable es peor que un campo de texto. Lo que falte se agrega desde
-- el panel cuando alguien lo pida.
insert into public.cities (name, state, aliases) values
  ('Aguascalientes', 'Aguascalientes', '{}'),
  ('Tijuana', 'Baja California', '{"tj"}'),
  ('Mexicali', 'Baja California', '{}'),
  ('Ensenada', 'Baja California', '{}'),
  ('La Paz', 'Baja California Sur', '{}'),
  ('Los Cabos', 'Baja California Sur', '{"cabo san lucas","san jose del cabo"}'),
  ('Campeche', 'Campeche', '{}'),
  ('Tuxtla Gutiérrez', 'Chiapas', '{"tuxtla"}'),
  ('San Cristóbal de las Casas', 'Chiapas', '{"san cristobal"}'),
  ('Chihuahua', 'Chihuahua', '{}'),
  ('Ciudad Juárez', 'Chihuahua', '{"juarez","cd juarez"}'),
  ('Ciudad de México', 'Ciudad de México', '{"cdmx","df","d.f.","distrito federal","mexico city","ciudad de mexico"}'),
  ('Saltillo', 'Coahuila', '{}'),
  ('Torreón', 'Coahuila', '{"torreon"}'),
  ('Monclova', 'Coahuila', '{}'),
  ('Piedras Negras', 'Coahuila', '{}'),
  ('Colima', 'Colima', '{}'),
  ('Manzanillo', 'Colima', '{}'),
  ('Durango', 'Durango', '{}'),
  ('Gómez Palacio', 'Durango', '{"gomez palacio"}'),
  ('Toluca', 'Estado de México', '{}'),
  ('Ecatepec', 'Estado de México', '{}'),
  ('Naucalpan', 'Estado de México', '{}'),
  ('Nezahualcóyotl', 'Estado de México', '{"neza","nezahualcoyotl"}'),
  ('Tlalnepantla', 'Estado de México', '{}'),
  ('León', 'Guanajuato', '{"leon"}'),
  ('Guanajuato', 'Guanajuato', '{}'),
  ('Irapuato', 'Guanajuato', '{}'),
  ('Celaya', 'Guanajuato', '{}'),
  ('Salamanca', 'Guanajuato', '{}'),
  ('Acapulco', 'Guerrero', '{}'),
  ('Chilpancingo', 'Guerrero', '{}'),
  ('Pachuca', 'Hidalgo', '{}'),
  ('Guadalajara', 'Jalisco', '{"gdl"}'),
  ('Zapopan', 'Jalisco', '{}'),
  ('Tlaquepaque', 'Jalisco', '{}'),
  ('Tonalá', 'Jalisco', '{"tonala"}'),
  ('Puerto Vallarta', 'Jalisco', '{"vallarta"}'),
  ('Morelia', 'Michoacán', '{}'),
  ('Uruapan', 'Michoacán', '{}'),
  ('Cuernavaca', 'Morelos', '{}'),
  ('Cuautla', 'Morelos', '{}'),
  ('Tepic', 'Nayarit', '{}'),
  ('Monterrey', 'Nuevo León', '{"mty"}'),
  ('San Nicolás de los Garza', 'Nuevo León', '{"san nicolas"}'),
  ('Guadalupe', 'Nuevo León', '{}'),
  ('San Pedro Garza García', 'Nuevo León', '{"san pedro"}'),
  ('Apodaca', 'Nuevo León', '{}'),
  ('Oaxaca de Juárez', 'Oaxaca', '{"oaxaca"}'),
  ('Puebla', 'Puebla', '{}'),
  ('Tehuacán', 'Puebla', '{"tehuacan"}'),
  ('Querétaro', 'Querétaro', '{"queretaro","qro"}'),
  ('Cancún', 'Quintana Roo', '{"cancun"}'),
  ('Chetumal', 'Quintana Roo', '{}'),
  ('Playa del Carmen', 'Quintana Roo', '{"playa"}'),
  ('San Luis Potosí', 'San Luis Potosí', '{"san luis potosi","slp"}'),
  ('Culiacán', 'Sinaloa', '{"culiacan"}'),
  ('Mazatlán', 'Sinaloa', '{"mazatlan"}'),
  ('Los Mochis', 'Sinaloa', '{}'),
  ('Hermosillo', 'Sonora', '{}'),
  ('Ciudad Obregón', 'Sonora', '{"obregon"}'),
  ('Nogales', 'Sonora', '{}'),
  ('Villahermosa', 'Tabasco', '{}'),
  ('Reynosa', 'Tamaulipas', '{}'),
  ('Tampico', 'Tamaulipas', '{}'),
  ('Matamoros', 'Tamaulipas', '{}'),
  ('Nuevo Laredo', 'Tamaulipas', '{}'),
  ('Ciudad Victoria', 'Tamaulipas', '{}'),
  ('Tlaxcala', 'Tlaxcala', '{}'),
  ('Veracruz', 'Veracruz', '{}'),
  ('Xalapa', 'Veracruz', '{"jalapa"}'),
  ('Coatzacoalcos', 'Veracruz', '{}'),
  ('Poza Rica', 'Veracruz', '{}'),
  ('Mérida', 'Yucatán', '{"merida"}'),
  ('Zacatecas', 'Zacatecas', '{}')
on conflict (name, state) do nothing;


-- -----------------------------------------------------------------------------
-- Perfiles: referencia al catálogo + texto libre para "Otro"
-- -----------------------------------------------------------------------------
alter table public.profiles
  rename column city to city_custom;

comment on column public.profiles.city_custom is
  'Ciudad escrita a mano. Solo se usa cuando city_id es nulo, es decir, cuando la persona eligió "Otro".';

alter table public.profiles
  add column city_id smallint references public.cities (id) on delete set null;

create index profiles_city_idx on public.profiles (city_id);


-- Migración de lo que ya había escrito la gente.
-- Se compara sin acentos ni mayúsculas, y también contra los alias, así que
-- "CDMX", "cdmx" y "Distrito Federal" caen todos en Ciudad de México.
update public.profiles p
set city_id = c.id,
    city_custom = null
from public.cities c
where p.city_custom is not null
  and (
    public.slugify(p.city_custom) = public.slugify(c.name)
    or exists (
      select 1 from unnest(c.aliases) a
      where public.slugify(a) = public.slugify(p.city_custom)
    )
  );


-- Coherencia: o se elige del catálogo, o se escribe a mano, pero no las dos.
alter table public.profiles
  add constraint profiles_city_single_source
  check (city_id is null or city_custom is null);


-- -----------------------------------------------------------------------------
-- Alta de usuarios: adaptar al nuevo esquema
-- -----------------------------------------------------------------------------
-- CRÍTICO. El trigger handle_new_user insertaba en `profiles.city`, columna que
-- esta misma migración acaba de renombrar. Sin actualizarlo aquí, TODO registro
-- nuevo fallaría con "column city does not exist", y el fallo aparecería en
-- producción la primera vez que alguien intentara crear una cuenta.
--
-- Ahora acepta las dos formas desde el formulario:
--   city_id     → la persona eligió una ciudad del catálogo
--   city_custom → eligió "Otro" y la escribió
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_meta      jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_nickname  text;
  v_candidate text;
  v_attempt   int := 0;
  v_city_id   smallint;
  v_city_text text;
begin
  v_nickname := regexp_replace(
    btrim(coalesce(v_meta ->> 'nickname', '')),
    '[^A-Za-z0-9_.\-]', '', 'g'
  );

  if v_nickname is null or char_length(v_nickname) < 3 then
    v_nickname := 'player-' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  v_nickname  := substr(v_nickname, 1, 20);
  v_candidate := v_nickname;

  while exists (
    select 1 from public.profiles p where lower(p.nickname) = lower(v_candidate)
  ) loop
    v_attempt   := v_attempt + 1;
    v_candidate := substr(v_nickname, 1, 16) || '-' || v_attempt::text;
    exit when v_attempt > 999;
  end loop;

  v_city_id   := nullif(v_meta ->> 'city_id', '')::smallint;
  v_city_text := nullif(btrim(coalesce(v_meta ->> 'city_custom', v_meta ->> 'city', '')), '');

  -- Si llega texto libre que coincide con una ciudad del catálogo, se enlaza en
  -- lugar de guardarlo suelto. Evita duplicados desde el primer día.
  if v_city_id is null and v_city_text is not null then
    select c.id into v_city_id
    from public.cities c
    where public.slugify(c.name) = public.slugify(v_city_text)
       or exists (
         select 1 from unnest(c.aliases) a
         where public.slugify(a) = public.slugify(v_city_text)
       )
    limit 1;
  end if;

  -- La restricción profiles_city_single_source exige que solo uno tenga valor.
  if v_city_id is not null then
    v_city_text := null;
  end if;

  insert into public.profiles (
    id, nickname, country_code, city_id, city_custom, main_character_id, avatar_source
  ) values (
    new.id,
    v_candidate,
    coalesce(upper(nullif(v_meta ->> 'country_code', '')), 'MX'),
    v_city_id,
    v_city_text,
    nullif(v_meta ->> 'main_character_id', '')::smallint,
    coalesce(nullif(v_meta ->> 'avatar_source', '')::public.avatar_source, 'character')
  );

  insert into public.profile_private (id, full_name, birth_date)
  values (
    new.id,
    nullif(v_meta ->> 'full_name', ''),
    nullif(v_meta ->> 'birth_date', '')::date
  );

  return new;
end;
$$;


-- -----------------------------------------------------------------------------
-- Vista pública
-- -----------------------------------------------------------------------------
-- `city` conserva su nombre, su tipo y su posición: el frontend sigue leyendo
-- un solo campo y no necesita saber si vino del catálogo o del texto libre.
-- Las columnas nuevas van al final, que es lo único que permite
-- `create or replace view`.
create or replace view public.players_public
with (security_invoker = true) as
select
  p.id,
  p.nickname,
  coalesce(ci.name, p.city_custom) as city,
  p.country_code,
  p.bio,
  p.avatar_source,
  p.avatar_path,
  p.role,
  p.created_at,
  c.id        as character_id,
  c.slug      as character_slug,
  c.name      as character_name,
  c.color_hex as character_color,
  c.initials  as character_initials,
  c.icon_path as character_icon_path,
  p.city_id,
  ci.state    as city_state
from public.profiles p
left join public.characters c on c.id = p.main_character_id
left join public.cities ci    on ci.id = p.city_id
where p.status = 'active';

grant select on public.players_public to anon, authenticated;


-- -----------------------------------------------------------------------------
-- Ciudades escritas a mano que aún no están en el catálogo
-- -----------------------------------------------------------------------------
-- Alimenta el aviso del panel: "3 personas escribieron una ciudad que no está
-- en la lista". Sin esto, el administrador no tendría forma de enterarse y el
-- catálogo se quedaría desactualizado para siempre.
create or replace view public.pending_cities
with (security_invoker = true) as
select
  p.city_custom as name,
  count(*)      as players
from public.profiles p
where p.city_custom is not null
  and btrim(p.city_custom) <> ''
  and p.status = 'active'
group by p.city_custom
order by count(*) desc, p.city_custom;

comment on view public.pending_cities is
  'Ciudades escritas a mano. El panel las ofrece para promoverlas al catálogo.';

grant select on public.pending_cities to authenticated;
