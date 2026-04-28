import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Item } from "@queuepilot/core/types";
import { useApi } from "../../../hooks/useApi";
import type { FilterState } from "../../../store/ui.store";

export function useItems(filter: FilterState) {
  const api = useApi();
  return useQuery({
    queryKey: ["items", filter],
    queryFn: async () => {
      const res = await api.items.list(filter);
      return res.data as Item[];
    },
    staleTime: 1000 * 15,
  });
}

export function useUpdateItemStatus() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, position }: { id: string; status: string; position?: number | null }) => {
      const update: Record<string, unknown> = { status };
      if (position !== undefined) update.position = position;
      const res = await api.items.update(id, update);
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
