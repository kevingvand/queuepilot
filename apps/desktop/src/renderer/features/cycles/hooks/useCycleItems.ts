import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Item, Tag } from '@queuepilot/core/types';
import { useApi } from '../../../hooks/useApi';

export type ItemWithTags = Item & { tags: Pick<Tag, 'id' | 'name' | 'color'>[] };

export function useCycleItems(cycleId: string, tagIds?: string[]) {
  const api = useApi();
  const sortedTagIds = tagIds ? [...tagIds].sort() : undefined;
  return useQuery({
    queryKey: ['cycle-items', cycleId, { tagIds: sortedTagIds }],
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
      await queryClient.cancelQueries({ queryKey: ['cycle-items', cycleId] });
      const previousData = queryClient.getQueriesData<ItemWithTags[]>({ queryKey: ['cycle-items', cycleId] });
      const reorderedSet = new Set(ids);
      queryClient.setQueriesData<ItemWithTags[]>({ queryKey: ['cycle-items', cycleId] }, (old) => {
        if (!old) return old;
        const rest = old.filter((i) => !reorderedSet.has(i.id));
        const reordered = ids.map((id) => old.find((i) => i.id === id)!).filter(Boolean);
        return [...reordered, ...rest];
      });
      return { previousData };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.previousData.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cycle-items', cycleId] });
    },
  });
}
