/// <reference types="vite/client" />

/**
 * Tipos de las variables de entorno.
 *
 * Declararlas aquí hace que `import.meta.env.VITE_SUPABASE_URL` esté tipado y
 * que un error de nombre se detecte al compilar en lugar de en producción con
 * un `undefined` silencioso.
 */
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_BASE_PATH: string;
  readonly VITE_SITE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
