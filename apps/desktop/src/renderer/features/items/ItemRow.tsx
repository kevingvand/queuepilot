import type { Item } from '@queuepilot/core/types';
import type { BadgeProps } from '../../components/ui/badge';
import { Badge } from '../../components/ui/badge';
import { cn } from '../../lib/utils';

const PRIORITY_BORDER: Record<number, string> = {
  0: 'border-l-transparent',
  1: 'border-l-blue-400',
  2: 'border-l-yellow-400',
  3: 'border-l-orange-400',
  4: 'border-l-red-500',
};

export function ItemRow({
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
        'px-4 py-2.5 border-b border-border cursor-pointer transition-colors border-l-2',
        PRIORITY_BORDER[item.priority ?? 0],
        selected ? 'bg-accent' : 'hover:bg-accent/50',
      )}
      onClick={() => onSelect(item.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium truncate text-foreground flex-1">{item.title}</p>
        <Badge status={item.status as BadgeProps['status']} className="shrink-0 text-[10px]">
          {item.status.replace('_', ' ')}
        </Badge>
      </div>
      {item.body && (
        <p className="text-xs text-muted-foreground truncate mt-0.5">{item.body}</p>
      )}
    </div>
  );
}
