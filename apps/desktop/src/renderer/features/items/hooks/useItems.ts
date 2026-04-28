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
      await queryClient.cancelQueries({ queryKey: ['items'] });

      const previousData = queryClient.getQueriesData<Item[]>({ queryKey: ['items'] });

      queryClient.setQueriesData<Item[]>({ queryKey: ['items'] }, (old) =>
        old?.map((item) => (item.id === id ? { ...item, status } : item)) ?? old,
      );

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      context?.previousData.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['item', id] });
      queryClient.invalidateQueries({ queryKey: ['events', id] });
    },
  });
}
