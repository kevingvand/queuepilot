import { GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Item } from '@queuepilot/core/types';

const PRIORITY_COLOR: Record<number, string> = {
  0: 'transparent',
  1: '#3b82f6',
  2: '#fbbf24',
  3: '#f97316',
  4: '#ef4444',
};

export function CycleBoardCard({
  item,
  isDragOverlay = false,
}: {
  item: Item;
  isDragOverlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragOverlay ? undefined : transition,
    opacity: isDragging && !isDragOverlay ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeftColor: PRIORITY_COLOR[item.priority ?? 0],
        borderLeftWidth: '3px',
        borderRadius: '6px',
        padding: '10px 12px',
        boxShadow: isDragOverlay ? '0 8px 24px rgba(0,0,0,0.3)' : undefined,
        cursor: isDragOverlay ? 'grabbing' : 'pointer',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
        <button
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          style={{
            color: 'var(--text-muted)',
            cursor: 'grab',
            flexShrink: 0,
            marginTop: '1px',
            background: 'none',
            border: 'none',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <GripVertical size={14} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-primary)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: '1.4',
              margin: 0,
            }}
          >
            {item.title}
          </p>
          {item.body && (
            <p
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                margin: '4px 0 0 0',
              }}
            >
              {item.body}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
