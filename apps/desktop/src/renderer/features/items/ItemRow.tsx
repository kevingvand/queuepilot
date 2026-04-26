import type { Item } from '@queuepilot/core/types';
import type { BadgeProps } from '../../components/ui/badge';
import { Badge } from '../../components/ui/badge';

const PRIORITY_COLOR: Record<number, string> = {
  0: 'transparent',
  1: '#3b82f6',
  2: '#fbbf24',
  3: '#f97316',
  4: '#ef4444',
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
      className="px-4 py-3 border-b cursor-pointer transition-colors"
      style={{
        borderColor: 'var(--border)',
        borderLeftColor: PRIORITY_COLOR[item.priority ?? 0],
        borderLeftWidth: '3px',
        backgroundColor: selected ? 'var(--accent)' : 'transparent',
        color: selected ? '#ffffff' : 'var(--text-primary)',
      }}
      onClick={() => onSelect(item.id)}
      onMouseEnter={(e) => {
        if (!selected) {
          (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--surface-hover)';
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium truncate flex-1">{item.title}</p>
        <Badge status={item.status as BadgeProps['status']} className="shrink-0 text-[10px]">
          {item.status.replace('_', ' ')}
        </Badge>
      </div>
      {item.body && (
        <p className="text-xs truncate mt-1" style={{ color: selected ? 'rgba(255,255,255,0.85)' : 'var(--text-secondary)' }}>
          {item.body}
        </p>
      )}
    </div>
  );
}
