import { useQuery } from '@tanstack/react-query';
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
