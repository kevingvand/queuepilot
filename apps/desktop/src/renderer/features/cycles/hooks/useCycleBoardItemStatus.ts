import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../../../hooks/useApi';
import type { ItemWithTags } from './useCycleItems';

interface UpdateStatusArgs {
  id: string;
  status: string;
  position?: number | null;
}

export function useCycleBoardItemStatus(cycleId: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, position }: UpdateStatusArgs) => {
      const update: Record<string, unknown> = { status };
      if (position !== undefined) update.position = position;
      const res = await api.items.update(id, update);
      return res.data;
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['cycle-items', cycleId] });
      const previousData = queryClient.getQueriesData<ItemWithTags[]>({
        queryKey: ['cycle-items', cycleId],
      });
      queryClient.setQueriesData<ItemWithTags[]>(
        { queryKey: ['cycle-items', cycleId] },
        (old) => old?.map((item) => (item.id === id ? { ...item, status } : item)),
      );
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
