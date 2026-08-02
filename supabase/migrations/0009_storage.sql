-- =============================================================================
-- 0009_storage.sql
-- SSF2X México — Buckets de Storage y sus políticas
-- =============================================================================
-- Dos buckets, con reglas distintas:
--
--   avatars : escribe cada usuario en SU carpeta. Lectura pública.
--   media    : escribe solo el administrador. Lectura pública.
--
-- Los límites de tamaño se declaran aquí, en el servidor, además de validarse
-- en el cliente. La validación del navegador se puede saltar; esta no.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Buckets
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars', 'avatars', true,
  524288,  -- 512 KB. El cliente redimensiona y convierte a WebP antes de subir,
           -- así que este límite es holgado para un avatar de 256x256.
  array['image/webp', 'image/png', 'image/jpeg']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true,
  3145728,  -- 3 MB para portadas de noticias, eventos y tutoriales.
  array['image/webp', 'image/png', 'image/jpeg', 'image/gif']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;


-- -----------------------------------------------------------------------------
-- avatars
-- -----------------------------------------------------------------------------
-- Convención de ruta OBLIGATORIA: {user_id}/avatar.webp
-- La política compara la primera carpeta del path con el uid del usuario, así
-- que nadie puede escribir en la carpeta de otro aunque conozca su id.
create policy "avatars: lectura pública"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'avatars');

create policy "avatars: subir en carpeta propia"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "avatars: actualizar el propio"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "avatars: borrar el propio"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select public.is_admin())
    )
  );


-- -----------------------------------------------------------------------------
-- media — solo administradores escriben
-- -----------------------------------------------------------------------------
create policy "media: lectura pública"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'media');

create policy "media: escritura de administradores"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media' and (select public.is_admin()));

create policy "media: actualización de administradores"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'media' and (select public.is_admin()))
  with check (bucket_id = 'media' and (select public.is_admin()));

create policy "media: borrado de administradores"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));


-- -----------------------------------------------------------------------------
-- Limpieza del avatar anterior
-- -----------------------------------------------------------------------------
-- Sin esto, cada cambio de avatar dejaría el archivo viejo huérfano en el bucket
-- y el almacenamiento crecería sin control. Al forzar siempre el mismo nombre
-- de archivo por usuario ({uid}/avatar.webp) el archivo se sobrescribe y el
-- problema desaparece; esta función queda como utilidad de mantenimiento para
-- borrar restos de usuarios eliminados.
create or replace function public.cleanup_orphan_avatars()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede ejecutar la limpieza de avatares.';
  end if;

  with removed as (
    delete from storage.objects o
    where o.bucket_id = 'avatars'
      and not exists (
        select 1 from public.profiles p
        where p.id::text = (storage.foldername(o.name))[1]
      )
    returning 1
  )
  select count(*) into v_deleted from removed;

  return v_deleted;
end;
$$;

comment on function public.cleanup_orphan_avatars() is
  'Borra avatares sin perfil asociado. Uso manual desde el panel de administración.';
