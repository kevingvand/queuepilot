import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Item } from '@queuepilot/core/types';
import { useApi } from '../../../hooks/useApi';
import type { FilterState } from '../../../store/ui.store';

export function useItems(filter: FilterState) {
  const api = useApi();
  return useQuery({
    queryKey: ['items', filter],
    queryFn: async () => {
      const res = await api.items.list(filter);
      return res.data as Item[];
    },
    staleTime: 1000 * 15,
  });
}

export function useCycleItems(cycleId: string) {
  return useItems({ cycle_id: cycleId });
}

export function useUpdateItemStatus() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await api.items.update(id, { status });
      return res.data as Item;
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['item', id] });
      queryClient.invalidateQueries({ queryKey: ['events', id] });
    },
  });
}
