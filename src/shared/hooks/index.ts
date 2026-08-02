import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listCharacters, listPublicSettings } from '@/shared/lib/catalog.service';
import { queryKeys } from '@/shared/lib/queryClient';

/** Retrasa un valor: evita disparar una consulta con cada tecla en un buscador. */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

/**
 * Catálogo de personajes.
 * Cambia una vez cada nunca, así que se cachea durante toda la sesión.
 */
export function useCharacters() {
  return useQuery({
    queryKey: queryKeys.characters,
    queryFn: listCharacters,
    staleTime: Infinity,
  });
}

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: listPublicSettings,
    staleTime: 30 * 60 * 1000,
  });
}

/** Lee un ajuste con valor por defecto, sin tener que comprobar undefined. */
export function useSetting<T>(key: string, fallback: T): T {
  const { data } = useSettings();
  const value = data?.[key];
  return (value as T) ?? fallback;
}

/** Lleva la página al inicio al cambiar de ruta. */
export function useScrollToTop(dependency: unknown) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [dependency]);
}
