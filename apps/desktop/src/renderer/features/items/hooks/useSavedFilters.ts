import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SavedFilter } from '@queuepilot/core/types';
import { useApi } from '../../../hooks/useApi';

export function useSavedFilters() {
  const api = useApi();
  return useQuery({
    queryKey: ['savedFilters'],
    queryFn: async () => {
      const res = await api.filters.list();
      return res.data as SavedFilter[];
    },
  });
}

export function useCreateSavedFilter() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { name: string; filter_json: string }) => {
      const res = await api.filters.create(body);
      return res.data as SavedFilter;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedFilters'] });
    },
  });
}

export function useDeleteSavedFilter() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.filters.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedFilters'] });
    },
  });
}
