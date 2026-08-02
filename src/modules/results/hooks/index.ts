import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/queryClient';
import * as service from '../services/results.service';

export function useAllResults() {
  return useQuery({ queryKey: queryKeys.results(), queryFn: service.listAllResults });
}

export function useResultsByEvent(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.results({ slug }),
    queryFn: () => service.listResultsByEventSlug(slug as string),
    enabled: Boolean(slug),
  });
}

export function usePlayerHistory(playerId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.playerHistory(playerId ?? ''),
    queryFn: () => service.listResultsByPlayer(playerId as string),
    enabled: Boolean(playerId),
  });
}

export function useRecentResults(limit = 8) {
  return useQuery({
    queryKey: queryKeys.results({ recent: limit }),
    queryFn: () => service.listRecentResults(limit),
  });
}

/* ------------------------------ Administración ---------------------------- */

export function useRawResults(eventId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.resultsByEvent(eventId ?? ''),
    queryFn: () => service.listRawResultsByEvent(eventId as string),
    enabled: Boolean(eventId),
  });
}

export function useSaveResults() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, rows }: { eventId: string; rows: service.ResultRowInput[] }) =>
      service.replaceEventResults(eventId, rows),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['results'] });
      client.invalidateQueries({ queryKey: ['players'] });
    },
  });
}
