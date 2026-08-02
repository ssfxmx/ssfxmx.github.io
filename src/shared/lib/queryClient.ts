import { QueryClient } from '@tanstack/react-query';

/**
 * Configuración de la caché de datos.
 *
 * El contenido de este sitio cambia poco: una noticia al mes, un torneo al mes.
 * Una caché generosa reduce llamadas a Supabase (relevante en el plan gratuito)
 * y hace que navegar entre secciones se sienta instantáneo.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Los errores de permisos no se reintentan: la respuesta sería la misma.
        const message = error instanceof Error ? error.message : '';
        if (/permission denied|row-level security|JWT/i.test(message)) return false;
        return failureCount < 2;
      },
    },
  },
});

/**
 * Claves de caché centralizadas.
 *
 * Tenerlas en un solo lugar evita el error clásico de invalidar con una clave
 * que no coincide con la que se usó al consultar, y que la interfaz se quede
 * mostrando datos viejos tras guardar.
 */
export const queryKeys = {
  characters: ['characters'] as const,
  settings: ['settings'] as const,

  news: (filters?: unknown) => ['news', filters] as const,
  newsDetail: (slug: string) => ['news', 'detail', slug] as const,

  events: (filters?: unknown) => ['events', filters] as const,
  eventDetail: (slug: string) => ['events', 'detail', slug] as const,
  upcomingEvents: ['events', 'upcoming'] as const,

  results: (filters?: unknown) => ['results', filters] as const,
  resultsByEvent: (eventId: string) => ['results', 'event', eventId] as const,

  players: (filters?: unknown) => ['players', filters] as const,
  playerDetail: (nickname: string) => ['players', 'detail', nickname] as const,
  playerStats: (playerId: string) => ['players', 'stats', playerId] as const,
  playerHistory: (playerId: string) => ['players', 'history', playerId] as const,

  tutorials: (filters?: unknown) => ['tutorials', filters] as const,
  tutorialDetail: (slug: string) => ['tutorials', 'detail', slug] as const,
  tutorialCategories: ['tutorials', 'categories'] as const,

  profile: (userId: string) => ['profile', userId] as const,

  adminNews: ['admin', 'news'] as const,
  adminEvents: ['admin', 'events'] as const,
  adminTutorials: ['admin', 'tutorials'] as const,
  adminPlayers: ['admin', 'players'] as const,
  adminStats: ['admin', 'stats'] as const,
} as const;
