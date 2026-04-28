import { GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import type { Item } from '@queuepilot/core/types';

const PRIORITY_COLOR: Record<number, string> = {
  0: 'transparent',
  1: '#3b82f6',
  2: '#fbbf24',
  3: '#f97316',
  4: '#ef4444',
};

/** Pure visual card — no dnd-kit hooks. Safe to render inside DragOverlay. */
export function CycleBoardCardContent({
  item,
  dragListeners,
  dragAttributes,
  lifted = false,
}: {
  item: Item;
  dragListeners?: DraggableSyntheticListeners;
  dragAttributes?: DraggableAttributes;
  lifted?: boolean;
}) {
  return (
    <div
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeftColor: PRIORITY_COLOR[item.priority ?? 0],
        borderLeftWidth: '3px',
        borderRadius: '6px',
        padding: '10px 12px',
        boxShadow: lifted ? '0 12px 32px rgba(0,0,0,0.35)' : undefined,
        transform: lifted ? 'rotate(1.5deg) scale(1.03)' : undefined,
        cursor: lifted ? 'grabbing' : 'pointer',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
        <button
          {...dragAttributes}
          {...dragListeners}
          aria-label="Drag to reorder"
          style={{
            color: 'var(--text-muted)',
            cursor: lifted ? 'grabbing' : 'grab',
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

/** Sortable card — wraps CycleBoardCardContent with @dnd-kit/sortable. Use inside SortableContext only. */
export function CycleBoardCard({ item }: { item: Item }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
      }}
    >
      <CycleBoardCardContent item={item} dragListeners={listeners} dragAttributes={attributes} />
    </div>
  );
}
