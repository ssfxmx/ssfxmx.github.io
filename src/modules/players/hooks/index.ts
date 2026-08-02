import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/queryClient';
import * as service from '../services/players.service';

export function usePlayers(filters: service.PlayerFilters) {
  return useQuery({
    queryKey: queryKeys.players(filters),
    queryFn: () => service.listPlayers(filters),
  });
}

export function usePlayerDetail(nickname: string | undefined) {
  return useQuery({
    queryKey: queryKeys.playerDetail(nickname ?? ''),
    queryFn: () => service.getPlayerByNickname(nickname as string),
    enabled: Boolean(nickname),
  });
}

export function usePlayerStats(playerId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.playerStats(playerId ?? ''),
    queryFn: () => service.getPlayerStats(playerId as string),
    enabled: Boolean(playerId),
  });
}

export function useTopPlayers(limit = 10) {
  return useQuery({
    queryKey: queryKeys.players({ top: limit }),
    queryFn: () => service.listTopPlayers(limit),
  });
}

export function useCities() {
  return useQuery({ queryKey: queryKeys.players({ cities: true }), queryFn: service.listCities });
}

/* ------------------------------ Administración ---------------------------- */

export function useAdminPlayers(search: string) {
  return useQuery({
    queryKey: [...queryKeys.adminPlayers, search],
    queryFn: () => service.listProfilesForAdmin(search),
  });
}

function useInvalidatePlayers() {
  const client = useQueryClient();
  return () => {
    client.invalidateQueries({ queryKey: ['players'] });
    client.invalidateQueries({ queryKey: queryKeys.adminPlayers });
  };
}

export function useSetPlayerStatus() {
  const invalidate = useInvalidatePlayers();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'suspended' | 'deleted' }) =>
      service.setPlayerStatus(id, status),
    onSuccess: invalidate,
  });
}

export function useUpdatePlayer() {
  const invalidate = useInvalidatePlayers();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: service.AdminPlayerEdit }) =>
      service.updatePlayerAsAdmin(id, input),
    onSuccess: invalidate,
  });
}

export function useSetPlayerRole() {
  const invalidate = useInvalidatePlayers();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'admin' | 'player' }) =>
      service.setPlayerRole(id, role),
    onSuccess: invalidate,
  });
}
