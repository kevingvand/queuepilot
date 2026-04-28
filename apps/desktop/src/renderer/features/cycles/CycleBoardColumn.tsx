import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Item } from '@queuepilot/core/types';
import { CycleBoardCard } from './CycleBoardCard';

export function CycleBoardColumn({
  columnId,
  label,
  accent,
  items,
  emptyText = 'Nothing here yet',
  activeDragId,
  compact = false,
  onCardClick,
}: {
  columnId: string;
  label: string;
  accent: string;
  items: Item[];
  emptyText?: string;
  /** ID of the item currently being dragged — used to show drop placeholder. */
  activeDragId?: string | null;
  /** When true, removes the fixed minWidth so a parent can control sizing. */
  compact?: boolean;
  onCardClick: (item: Item) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });

  // Show a drop placeholder only when hovering with a card that isn't already in this column.
  const showDropPlaceholder =
    isOver && activeDragId != null && !items.some((i) => i.id === activeDragId);

  return (
    <div
      ref={setNodeRef}
      style={{
        flex: '1 1 0',
        minWidth: compact ? 0 : '200px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: isOver ? 'var(--surface-hover)' : 'var(--bg-secondary)',
        borderRadius: '8px',
        border: isOver ? '1px solid var(--accent)' : '1px solid var(--border)',
        transition: 'background-color 150ms, border-color 150ms',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <span className={`text-sm font-semibold ${accent}`}>{label}</span>
        <span
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            backgroundColor: 'var(--surface)',
            borderRadius: '10px',
            padding: '1px 7px',
          }}
        >
          {items.length}
        </span>
      </div>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <div key={item.id} onClick={() => onCardClick(item)}>
              <CycleBoardCard item={item} />
            </div>
          ))}
        </SortableContext>

        {showDropPlaceholder && (
          <div
            aria-hidden
            style={{
              border: '2px dashed var(--accent)',
              borderRadius: '6px',
              height: '56px',
              flexShrink: 0,
              opacity: 0.6,
            }}
          />
        )}

        {items.length === 0 && !showDropPlaceholder && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px 16px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '12px',
              lineHeight: '1.5',
            }}
          >
            {emptyText}
          </div>
        )}
      </div>
    </div>
  );
}
