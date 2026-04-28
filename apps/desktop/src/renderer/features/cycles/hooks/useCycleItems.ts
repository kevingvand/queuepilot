import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Item } from '@queuepilot/core/types';
import type { Tag } from '@queuepilot/core/types';
import { useApi } from '../../../hooks/useApi';

export type ItemWithTags = Item & { tags: Pick<Tag, 'id' | 'name' | 'color'>[] };

export function useCycleItems(cycleId: string, tagIds?: string[]) {
  const api = useApi();
  return useQuery({
    queryKey: ['items', { cycle_id: cycleId, tagIds }],
    queryFn: async () => {
      const query =
        tagIds && tagIds.length > 0 ? { tagIds: tagIds.join(',') } : undefined;
      const res = await api.cycles.items(cycleId, query);
      return res.data as ItemWithTags[];
    },
    staleTime: 1000 * 15,
  });
}

export function useCycleTags(cycleId: string) {
  const api = useApi();
  return useQuery({
    queryKey: ['cycleTags', cycleId],
    queryFn: async () => {
      const res = await api.cycles.tags(cycleId);
      return res.data as Tag[];
    },
    staleTime: 1000 * 30,
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
      await queryClient.cancelQueries({ queryKey: ['items'] });
      const previousData = queryClient.getQueryData<Item[]>(['items', { cycle_id: cycleId }]);
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
