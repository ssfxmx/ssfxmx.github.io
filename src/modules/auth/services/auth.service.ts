import { supabase } from '@/shared/lib/supabase';
import type { Profile, ProfilePrivate } from '@/shared/types/database';

/**
 * Servicios de autenticación y perfil propio.
 *
 * Único punto del módulo que habla con Supabase. Los componentes consumen los
 * hooks, y los hooks consumen estas funciones.
 */

export interface SignUpInput {
  email: string;
  password: string;
  nickname: string;
  fullName: string;
  birthDate: string;
  countryCode: string;
  /** Ciudad del catálogo. Nulo si la persona eligió "Otro". */
  cityId: number | null;
  /** Texto libre. Solo si cityId es nulo. */
  cityCustom: string;
  mainCharacterId: number;
}

/**
 * Registro.
 *
 * Los datos del perfil viajan en `options.data` (raw_user_meta_data). El trigger
 * handle_new_user de la migración 0003 crea el perfil y su fila privada dentro
 * de la misma transacción del alta.
 *
 * Se hace así, y no con un insert desde el cliente después del registro, porque
 * un fallo de red entre ambas llamadas dejaría cuentas sin perfil, imposibles
 * de usar y molestas de reparar a mano.
 */
export async function signUp(input: SignUpInput) {
  const redirectTo = `${import.meta.env.VITE_SITE_URL ?? window.location.origin}/auth/callback`;

  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: {
      emailRedirectTo: redirectTo,
      data: {
        nickname: input.nickname.trim(),
        full_name: input.fullName.trim(),
        birth_date: input.birthDate,
        country_code: input.countryCode,
        // El trigger acepta las dos formas y, si el texto libre coincide con
        // una ciudad del catálogo o con uno de sus alias, la enlaza solo.
        city_id: input.cityId ? String(input.cityId) : '',
        city_custom: input.cityId ? '' : input.cityCustom.trim(),
        main_character_id: String(input.mainCharacterId),
        avatar_source: 'character',
      },
    },
  });

  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function requestPasswordReset(email: string) {
  const redirectTo = `${import.meta.env.VITE_SITE_URL ?? window.location.origin}/auth/nueva-contrasena`;
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo,
  });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function updateEmail(email: string) {
  const { error } = await supabase.auth.updateUser({ email: email.trim().toLowerCase() });
  if (error) throw error;
}

/**
 * Disponibilidad de nickname.
 *
 * Se consulta mediante una función RPC y no con un SELECT sobre profiles para
 * no dar a usuarios anónimos la capacidad de enumerar la tabla de jugadores.
 */
export async function isNicknameAvailable(nickname: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_nickname_available', {
    p_nickname: nickname,
  });
  if (error) throw error;
  return Boolean(data);
}

/** Perfil propio, incluyendo los datos privados. */
export async function getOwnProfile(
  userId: string
): Promise<(Profile & { private: ProfilePrivate | null }) | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!profile) return null;

  const { data: priv } = await supabase
    .from('profile_private')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  return { ...(profile as Profile), private: (priv as ProfilePrivate) ?? null };
}

export interface UpdateProfileInput {
  city_id: number | null;
  city_custom: string | null;
  country_code: string;
  bio: string | null;
  main_character_id: number | null;
  avatar_source: 'character' | 'upload';
  avatar_path?: string | null;
}

/**
 * Actualiza el perfil propio.
 *
 * No se envían `role` ni `status`: aunque se enviaran, el trigger
 * protect_profile_privileged_fields los revertiría. La seguridad no depende de
 * que este archivo se porte bien.
 */
export async function updateOwnProfile(userId: string, input: UpdateProfileInput) {
  const { error } = await supabase.from('profiles').update(input).eq('id', userId);
  if (error) throw error;
}

/** Sube el avatar. La ruta es fija por usuario: la política de Storage la exige. */
export async function uploadAvatar(userId: string, blob: Blob): Promise<string> {
  const path = `${userId}/avatar.webp`;

  const { error } = await supabase.storage.from('avatars').upload(path, blob, {
    contentType: 'image/webp',
    // Sobrescribir en lugar de crear un archivo nuevo evita dejar huérfanos en
    // el bucket cada vez que alguien cambia su foto.
    upsert: true,
  });

  if (error) throw error;
  return path;
}
