import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/queryClient';
import * as service from '../services/tutorials.service';

export function useTutorialCategories() {
  return useQuery({
    queryKey: queryKeys.tutorialCategories,
    queryFn: service.listTutorialCategories,
    staleTime: Infinity,
  });
}

export function useTutorials() {
  return useQuery({ queryKey: queryKeys.tutorials(), queryFn: service.listTutorials });
}

export function useTutorialDetail(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tutorialDetail(slug ?? ''),
    queryFn: () => service.getTutorialBySlug(slug as string),
    enabled: Boolean(slug),
  });
}

/* ------------------------------ Administración ---------------------------- */

export function useAdminTutorials() {
  return useQuery({ queryKey: queryKeys.adminTutorials, queryFn: service.listAllTutorials });
}

export function useAdminTutorial(id: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'tutorials', id],
    queryFn: () => service.getTutorialById(id as string),
    enabled: Boolean(id),
  });
}

function useInvalidateTutorials() {
  const client = useQueryClient();
  return () => {
    client.invalidateQueries({ queryKey: ['tutorials'] });
    client.invalidateQueries({ queryKey: queryKeys.adminTutorials });
  };
}

export function useCreateTutorial() {
  const invalidate = useInvalidateTutorials();
  return useMutation({ mutationFn: service.createTutorial, onSuccess: invalidate });
}

export function useUpdateTutorial() {
  const invalidate = useInvalidateTutorials();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<service.TutorialInput> }) =>
      service.updateTutorial(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteTutorial() {
  const invalidate = useInvalidateTutorials();
  return useMutation({ mutationFn: service.deleteTutorial, onSuccess: invalidate });
}
