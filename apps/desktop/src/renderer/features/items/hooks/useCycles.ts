import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Cycle, NewCycle } from '@queuepilot/core/types';
import { useApi } from '../../../hooks/useApi';

export function useCycles() {
  const api = useApi();
  return useQuery({
    queryKey: ['cycles'],
    queryFn: async () => {
      const res = await api.cycles.list();
      return res.data as Cycle[];
    },
  });
}

export function useCreateCycle() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: NewCycle) => {
      const res = await api.cycles.create(body);
      return res.data as Cycle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
    },
  });
}

export function useUpdateCycle() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<NewCycle> }) => {
      const res = await api.cycles.update(id, data);
      return res.data as Cycle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
    },
  });
}

export function useActivateCycle() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.cycles.update(id, { status: 'active' } as Partial<NewCycle>);
      return res.data as Cycle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
    },
  });
}

export function useDeactivateCycle() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.cycles.update(id, { status: 'planned' } as Partial<NewCycle>);
      return res.data as Cycle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
    },
  });
}
export function useDeleteCycle() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.cycles.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
    },
  });
}
