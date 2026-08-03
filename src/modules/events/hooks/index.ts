import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/queryClient';
import * as service from '../services/events.service';

export function useUpcomingEvents(limit = 20) {
  return useQuery({
    queryKey: queryKeys.upcomingEvents,
    queryFn: () => service.listUpcomingEvents(limit),
  });
}

export function usePastEvents(
  page = 1,
  pageSize = 12,
  filters: service.EventFilters = {}
) {
  return useQuery({
    queryKey: queryKeys.events({ past: true, page, pageSize, ...filters }),
    queryFn: () => service.listPastEvents(page, pageSize, filters),
    placeholderData: (previous) => previous,
  });
}

/** Año del evento pasado más antiguo, para el desplegable de años. */
export function useOldestEventYear() {
  return useQuery({
    queryKey: ['events', 'oldest-year'],
    queryFn: service.getOldestEventYear,
    staleTime: 60 * 60 * 1000,
  });
}

export function useVisibleEvents() {
  return useQuery({
    queryKey: queryKeys.events({ all: true }),
    queryFn: service.listVisibleEvents,
  });
}

export function useEventDetail(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.eventDetail(slug ?? ''),
    queryFn: () => service.getEventBySlug(slug as string),
    enabled: Boolean(slug),
  });
}

export function useNextEvent() {
  return useQuery({
    queryKey: queryKeys.events({ next: true }),
    queryFn: service.getNextEvent,
  });
}

/* ------------------------------ Administración ---------------------------- */

export function useAdminEvents() {
  return useQuery({ queryKey: queryKeys.adminEvents, queryFn: service.listAllEvents });
}

export function useAdminEvent(id: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'events', id],
    queryFn: () => service.getEventById(id as string),
    enabled: Boolean(id),
  });
}

export function useFinishedEvents() {
  return useQuery({
    queryKey: ['admin', 'events', 'finished'],
    queryFn: service.listFinishedEvents,
  });
}

function useInvalidateEvents() {
  const client = useQueryClient();
  return () => {
    client.invalidateQueries({ queryKey: ['events'] });
    client.invalidateQueries({ queryKey: ['admin', 'events'] });
  };
}

export function useCreateEvent() {
  const invalidate = useInvalidateEvents();
  return useMutation({ mutationFn: service.createEvent, onSuccess: invalidate });
}

export function useUpdateEvent() {
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<service.EventInput> }) =>
      service.updateEvent(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteEvent() {
  const invalidate = useInvalidateEvents();
  return useMutation({ mutationFn: service.deleteEvent, onSuccess: invalidate });
}
