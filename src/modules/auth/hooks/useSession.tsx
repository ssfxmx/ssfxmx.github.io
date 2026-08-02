import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/shared/lib/supabase';
import type { Profile } from '@/shared/types/database';

/**
 * Sesión del usuario.
 *
 * Es el único estado verdaderamente global de la aplicación: casi todas las
 * pantallas necesitan saber si hay sesión y si es administrador. El resto de
 * datos vive en la caché de TanStack Query, no en contextos.
 *
 * IMPORTANTE: `isAdmin` sirve solo para decidir qué se MUESTRA. No es una
 * medida de seguridad. Quien manipule este valor en el navegador seguirá
 * chocando contra las políticas RLS al intentar escribir.
 */

interface SessionContextValue {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadProfile(userId: string | undefined) {
    if (!userId) {
      setProfile(null);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    setProfile((data as Profile) ?? null);
  }

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await loadProfile(data.session?.user.id);
      if (active) setIsLoading(false);
    });

    // Cubre login, logout, refresco de token y la vuelta desde el enlace de
    // confirmación de correo.
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, next) => {
      if (!active) return;
      setSession(next);
      await loadProfile(next?.user.id);
      setIsLoading(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      profile,
      isLoading,
      isAuthenticated: Boolean(session),
      isAdmin: profile?.role === 'admin' && profile?.status === 'active',
      refreshProfile: () => loadProfile(session?.user.id),
    }),
    [session, profile, isLoading]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession debe usarse dentro de <SessionProvider>.');
  }
  return context;
}
