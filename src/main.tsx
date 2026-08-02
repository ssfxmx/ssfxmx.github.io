import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/shared/lib/queryClient';
import { SessionProvider } from '@/modules/auth/hooks/useSession';
import { router } from '@/app/router';
import './styles/index.css';

/**
 * Punto de entrada.
 *
 * Orden de los providers, de fuera hacia dentro:
 *   QueryClientProvider → caché de datos
 *   SessionProvider     → sesión (necesita poder consultar Supabase)
 *   RouterProvider      → rutas (las guardas dependen de la sesión)
 */
const container = document.getElementById('root');

if (!container) {
  throw new Error('No se encontró el elemento #root en index.html.');
}

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <RouterProvider router={router} />
      </SessionProvider>
    </QueryClientProvider>
  </StrictMode>
);
