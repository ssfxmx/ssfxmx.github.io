import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as service from '../services/highlights.service';

export function useHighlights() {
  return useQuery({ queryKey: ['highlights'], queryFn: service.listHighlights });
}

export function useHighlightDetail(slug: string | undefined) {
  return useQuery({
    queryKey: ['highlights', 'detail', slug],
    queryFn: () => service.getHighlightBySlug(slug as string),
    enabled: Boolean(slug),
  });
}

export function useHighlightsByEvent(eventId: string | undefined) {
  return useQuery({
    queryKey: ['highlights', 'event', eventId],
    queryFn: () => service.listHighlightsByEvent(eventId as string),
    enabled: Boolean(eventId),
  });
}

/* ------------------------------ Administración ---------------------------- */

export function useAdminHighlights() {
  return useQuery({
    queryKey: ['admin', 'highlights'],
    queryFn: service.listAllHighlights,
  });
}

export function useAdminHighlight(id: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'highlights', id],
    queryFn: () => service.getHighlightById(id as string),
    enabled: Boolean(id),
  });
}

function useInvalidateHighlights() {
  const client = useQueryClient();
  return () => {
    client.invalidateQueries({ queryKey: ['highlights'] });
    client.invalidateQueries({ queryKey: ['admin', 'highlights'] });
  };
}

export function useCreateHighlight() {
  const invalidate = useInvalidateHighlights();
  return useMutation({ mutationFn: service.createHighlight, onSuccess: invalidate });
}

export function useUpdateHighlight() {
  const invalidate = useInvalidateHighlights();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<service.HighlightInput> }) =>
      service.updateHighlight(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteHighlight() {
  const invalidate = useInvalidateHighlights();
  return useMutation({ mutationFn: service.deleteHighlight, onSuccess: invalidate });
}
