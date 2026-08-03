import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/queryClient';
import * as service from '../services/news.service';

export function useNewsList(
  page: number,
  pageSize = 9,
  filters: service.NewsFilters = {}
) {
  return useQuery({
    // Los filtros entran en la clave: sin esto, cambiar de año mostraría los
    // resultados cacheados del anterior hasta que llegara la respuesta.
    queryKey: queryKeys.news({ page, pageSize, ...filters }),
    queryFn: () => service.listNews(page, pageSize, filters),
    // Evita el parpadeo a "cargando" con cada tecla del buscador: se mantiene
    // el listado anterior en pantalla hasta que llega el nuevo.
    placeholderData: (previous) => previous,
  });
}

/** Año de la noticia más antigua. Cambia una vez al año, se cachea de sobra. */
export function useOldestNewsYear() {
  return useQuery({
    queryKey: ['news', 'oldest-year'],
    queryFn: service.getOldestNewsYear,
    staleTime: 60 * 60 * 1000,
  });
}

export function useNewsDetail(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.newsDetail(slug ?? ''),
    queryFn: () => service.getNewsBySlug(slug as string),
    enabled: Boolean(slug),
  });
}

export function useFeaturedNews(limit = 3) {
  return useQuery({
    queryKey: queryKeys.news({ featured: limit }),
    queryFn: () => service.listFeaturedNews(limit),
  });
}

/* ------------------------------ Administración ---------------------------- */

export function useAdminNews() {
  return useQuery({ queryKey: queryKeys.adminNews, queryFn: service.listAllNews });
}

export function useAdminNewsItem(id: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'news', id],
    queryFn: () => service.getNewsById(id as string),
    enabled: Boolean(id),
  });
}

/** Invalida todas las claves que empiezan por 'news' además de las de admin. */
function useInvalidateNews() {
  const client = useQueryClient();
  return () => {
    client.invalidateQueries({ queryKey: ['news'] });
    client.invalidateQueries({ queryKey: queryKeys.adminNews });
  };
}

export function useCreateNews() {
  const invalidate = useInvalidateNews();
  return useMutation({ mutationFn: service.createNews, onSuccess: invalidate });
}

export function useUpdateNews() {
  const invalidate = useInvalidateNews();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<service.NewsInput> }) =>
      service.updateNews(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteNews() {
  const invalidate = useInvalidateNews();
  return useMutation({ mutationFn: service.deleteNews, onSuccess: invalidate });
}
