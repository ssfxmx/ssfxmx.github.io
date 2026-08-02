import { createClient } from '@supabase/supabase-js';

/**
 * Cliente único de Supabase.
 *
 * REGLA DE ARQUITECTURA: este módulo solo se importa desde archivos
 * `*.service.ts`. Ningún componente de React habla con Supabase directamente.
 *
 * Es la decisión que más protege el proyecto a largo plazo: si dentro de tres
 * años cambia el proveedor, se renombra una tabla o hay que optimizar una
 * consulta, se toca la capa de servicios y no cuarenta componentes.
 *
 * Sobre la llave: es la publishable key (sb_publishable_...), pública por
 * diseño. Viaja dentro del bundle y cualquiera puede leerla. Eso no es un
 * descuido: la seguridad real vive en las políticas RLS del esquema, que se
 * verificaron contra PostgreSQL antes de publicar.
 */

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY. ' +
      'Copia .env.example a .env.local antes de ejecutar el proyecto.'
  );
}

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // La sesión llega en el fragmento de la URL tras confirmar el correo.
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

/** URL pública de un archivo en Storage. Se guarda la ruta, no la URL completa. */
export function storagePublicUrl(
  bucket: 'avatars' | 'media',
  path: string | null | undefined
): string | null {
  if (!path) return null;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/**
 * Traduce errores de Supabase a mensajes en español.
 *
 * Sin esto el usuario ve cadenas como "duplicate key value violates unique
 * constraint", que no le dicen nada y parecen un fallo del sitio.
 */
export function friendlyError(error: unknown): string {
  if (!error) return 'Ocurrió un error inesperado.';

  const message =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : String((error as { message?: string }).message ?? '');

  const map: Array<[RegExp, string]> = [
    [/Invalid login credentials/i, 'Correo o contraseña incorrectos.'],
    [/Email not confirmed/i, 'Falta confirmar tu correo. Revisa tu bandeja de entrada.'],
    [/User already registered/i, 'Ya existe una cuenta con ese correo.'],
    [/Password should be at least/i, 'La contraseña debe tener al menos 8 caracteres.'],
    [/duplicate key.*nickname/i, 'Ese nickname ya está ocupado.'],
    [/duplicate key.*slug/i, 'Ya existe un contenido con ese título.'],
    [/event_results_unique_position/i, 'Esa posición ya está ocupada en este torneo.'],
    [/event_results_unique_player/i, 'Ese jugador ya tiene una posición en este torneo.'],
    [/estado finished/i, 'Solo se pueden registrar resultados en eventos finalizados.'],
    [/último administrador/i, 'No puedes degradar al último administrador del sitio.'],
    [/row-level security|permission denied/i, 'No tienes permiso para hacer esto.'],
    [/rate limit|too many requests/i, 'Demasiados intentos. Espera unos minutos.'],
    [/Failed to fetch|NetworkError/i, 'Sin conexión con el servidor. Revisa tu internet.'],
  ];

  for (const [pattern, text] of map) {
    if (pattern.test(message)) return text;
  }

  return message || 'Ocurrió un error inesperado.';
}
