import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Configuración de Vite.
 *
 * Dos detalles importantes para GitHub Pages:
 *
 * 1. `base` sale de VITE_BASE_PATH. Hoy vale '/' porque el repositorio se llama
 *    ssfxmx.github.io y el sitio se sirve en la raíz del dominio. Si algún día
 *    se migra a un dominio propio o a una subcarpeta, se cambia la variable y
 *    no hay que tocar ni una línea de código.
 *
 * 2. El plugin `spaFallback` copia index.html a 404.html al terminar el build.
 *    GitHub Pages no permite reglas de reescritura, así que al entrar directo a
 *    /eventos/abril-2026 el servidor devolvería un 404. Al servir esa misma
 *    aplicación como página de error, React Router resuelve la ruta en cliente
 *    y el usuario no nota nada. Es el truco estándar para SPAs en Pages.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: env.VITE_BASE_PATH || '/',
    plugins: [
      react(),
      {
        name: 'spa-fallback-404',
        closeBundle() {
          const index = resolve('dist/index.html');
          if (existsSync(index)) {
            copyFileSync(index, resolve('dist/404.html'));
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          // Separar las librerías grandes mejora el caché: cuando cambia el
          // código del sitio, el navegador no vuelve a descargar React entero.
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            supabase: ['@supabase/supabase-js'],
            query: ['@tanstack/react-query'],
          },
        },
      },
    },
    server: {
      port: 5173,
    },
  };
});
