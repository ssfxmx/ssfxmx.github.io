import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useSession } from '@/modules/auth/hooks/useSession';
import { routes } from '@/shared/constants/routes';
import { Spinner } from '@/shared/components/ui';

/**
 * Guardas de ruta.
 *
 * Evitan que alguien llegue a una pantalla que no le corresponde y le muestran
 * algo sensato en su lugar. NO son seguridad: la seguridad son las políticas
 * RLS. Aquí solo se decide qué se pinta.
 */

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useSession();
  const location = useLocation();

  if (isLoading) return <Spinner label="VERIFICANDO SESIÓN" />;

  if (!isAuthenticated) {
    // Se recuerda a dónde quería ir para devolverlo ahí tras iniciar sesión.
    return <Navigate to={routes.login} state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAdmin, isLoading } = useSession();
  const location = useLocation();

  if (isLoading) return <Spinner label="VERIFICANDO PERMISOS" />;

  if (!isAuthenticated) {
    return <Navigate to={routes.login} state={{ from: location.pathname }} replace />;
  }

  // A un usuario sin permisos se le manda al inicio, no a una pantalla de
  // "acceso denegado": no hace falta confirmarle que el panel existe.
  if (!isAdmin) return <Navigate to={routes.home} replace />;

  return <>{children}</>;
}

/** Impide volver al login estando dentro. */
export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useSession();
  if (isLoading) return <Spinner />;
  if (isAuthenticated) return <Navigate to={routes.profile} replace />;
  return <>{children}</>;
}
