import { useQuery } from '@tanstack/react-query';
import type { Item } from '@queuepilot/core/types';
import { useApi } from '../../hooks/useApi';
import { cn } from '../../lib/utils';
import { useUiStore } from '../../store/ui.store';

export function ItemList() {
  const { filterState, selectedItemId, setSelectedItemId } = useUiStore();
  const api = useApi();

  const { data: items, isLoading } = useQuery({
    queryKey: ['items', filterState],
    queryFn: async () => {
      const res = await api.items.list(filterState);
      return res.data as Item[];
    },
  });

  const filterLabel = filterState.status ?? filterState.cycle_id ?? filterState.tag ?? 'All Items';

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-4 py-3 border-b border-border">
        <span className="text-sm font-medium text-foreground capitalize">
          {filterLabel.replace('_', ' ')}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="px-4 py-8 text-sm text-muted-foreground text-center">Loading…</div>
        )}
        {!isLoading && (!items || items.length === 0) && (
          <div className="px-4 py-8 text-sm text-muted-foreground text-center">No items</div>
        )}
        {items?.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            selected={selectedItemId === item.id}
            onSelect={setSelectedItemId}
          />
        ))}
      </div>
    </div>
  );
}

function ItemRow({
  item,
  selected,
  onSelect,
}: {
  item: Item;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        'px-4 py-2 border-b border-border cursor-pointer transition-colors',
        selected ? 'bg-accent' : 'hover:bg-accent/50',
      )}
      onClick={() => onSelect(item.id)}
    >
      <p className="text-sm font-medium truncate text-foreground">{item.title}</p>
      <p className="text-xs text-muted-foreground capitalize">{item.status.replace('_', ' ')}</p>
    </div>
  );
}
