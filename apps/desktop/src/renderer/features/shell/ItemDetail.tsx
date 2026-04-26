import { useQuery } from '@tanstack/react-query';
import type { Item } from '@queuepilot/core/types';
import { Badge } from '../../components/ui/badge';
import { ScrollArea } from '../../components/ui/scroll-area';
import { useApi } from '../../hooks/useApi';
import { useUiStore } from '../../store/ui.store';

export function ItemDetail() {
  const { selectedItemId } = useUiStore();
  const api = useApi();

  const { data: item, isLoading } = useQuery({
    queryKey: ['item', selectedItemId],
    queryFn: async () => {
      const res = await api.items.get(selectedItemId as string);
      return res.data as Item;
    },
    enabled: selectedItemId !== null,
  });

  if (!selectedItemId) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground bg-background">
        Select an item
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground bg-background">
        Loading…
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground bg-background">
        Item not found
      </div>
    );
  }

  const statusVariant = item.status as 'inbox' | 'in_progress' | 'done' | 'discarded';

  return (
    <ScrollArea className="h-full bg-background">
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <h2 className="text-base font-semibold text-foreground leading-snug">{item.title}</h2>
          <div className="flex items-center gap-2">
            <Badge status={statusVariant}>{item.status.replace('_', ' ')}</Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(item.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {item.body && (
          <pre className="text-sm text-foreground/80 whitespace-pre-wrap font-sans leading-relaxed">
            {item.body}
          </pre>
        )}
      </div>
    </ScrollArea>
  );
}
