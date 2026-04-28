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
  const api = useApi();
  return useQuery({
    queryKey: ['items', { cycle_id: cycleId }],
    queryFn: async () => {
      const res = await api.cycles.items(cycleId);
      return res.data as Item[];
    },
    staleTime: 1000 * 15,
  });
}

export function useReorderCycleItems(cycleId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ column, ids }: { column: string; ids: string[] }) => {
      const res = await api.cycles.reorder(cycleId, { column, ids });
      return res.data;
    },
    onMutate: async ({ ids }) => {
      await queryClient.cancelQueries({ queryKey: ['items', { cycle_id: cycleId }] });
      const previousData = queryClient.getQueryData<Item[]>(['items', { cycle_id: cycleId }]);
      // Optimistically reorder: rebuild the list with ids in their new positions,
      // preserving items that aren't part of this column's reorder.
      queryClient.setQueryData<Item[]>(['items', { cycle_id: cycleId }], (old) => {
        if (!old) return old;
        const reorderedSet = new Set(ids);
        const rest = old.filter((i) => !reorderedSet.has(i.id));
        const reordered = ids.map((id) => old.find((i) => i.id === id)!).filter(Boolean);
        return [...reordered, ...rest];
      });
      return { previousData };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previousData) {
        queryClient.setQueryData(['items', { cycle_id: cycleId }], ctx.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['items', { cycle_id: cycleId }] });
    },
  });
}
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await api.items.update(id, { status });
      return res.data as Item;
    },
    onMutate: async ({ id, status }) => {
      // Cancel in-flight refetches so they don't overwrite the optimistic update.
      await queryClient.cancelQueries({ queryKey: ['items'] });

      // Snapshot current data for rollback on error.
      const previousData = queryClient.getQueriesData<Item[]>({ queryKey: ['items'] });

      // Immediately apply the status change across all items query caches.
      queryClient.setQueriesData<Item[]>({ queryKey: ['items'] }, (old) =>
        old?.map((item) => (item.id === id ? { ...item, status } : item)) ?? old,
      );

      return { previousData };
    },
    onError: (_err, _vars, ctx) => {
      // Roll back to the snapshot on failure.
      ctx?.previousData.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: (_data, _err, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['item', id] });
      queryClient.invalidateQueries({ queryKey: ['events', id] });
    },
  });
}
