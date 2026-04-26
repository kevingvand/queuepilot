import { useQuery } from '@tanstack/react-query';
import type { Comment, Item, ItemEvent, ItemLink } from '@queuepilot/core/types';
import { useApi } from '../../../hooks/useApi';

export function useItemDetail(itemId: string | null) {
  const api = useApi();

  const item = useQuery({
    queryKey: ['item', itemId],
    queryFn: async () => (await api.items.get(itemId!)).data as Item,
    enabled: !!itemId,
  });

  const comments = useQuery({
    queryKey: ['comments', itemId],
    queryFn: async () => (await api.items.comments.list(itemId!)).data as Comment[],
    enabled: !!itemId,
  });

  const events = useQuery({
    queryKey: ['events', itemId],
    queryFn: async () => (await api.items.events(itemId!)).data as ItemEvent[],
    enabled: !!itemId,
  });

  const links = useQuery({
    queryKey: ['links', itemId],
    queryFn: async () => (await api.items.links.list(itemId!)).data as ItemLink[],
    enabled: !!itemId,
  });

  return { item, comments, events, links };
}
