import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Item } from '@queuepilot/core/types';
import { CycleBoardCard } from './CycleBoardCard';

export type ColumnDragStatus = 'valid' | 'invalid' | 'source' | undefined;

export function CycleBoardColumn({
  columnId,
  label,
  accent,
  items,
  emptyText = 'Nothing here yet',
  activeDragId,
  dragStatus,
  selectedItemId,
  compact = false,
  onCardClick,
}: {
  columnId: string;
  label: string;
  accent: string;
  items: Item[];
  emptyText?: string;
  /** ID of the item currently being dragged. */
  activeDragId?: string | null;
  /** How this column should appear relative to the active drag. */
  dragStatus?: ColumnDragStatus;
  /** Currently selected item ID — used to highlight the selected card. */
  selectedItemId?: string | null;
  /** When true, removes the fixed minWidth so a parent can control sizing. */
  compact?: boolean;
  onCardClick: (item: Item) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });

  const isInvalidHover = isOver && dragStatus === 'invalid';
  const isValidHover = isOver && dragStatus !== 'invalid';

  // Drop placeholder shown at bottom (outside scroll) when hovering a valid target
  // with a card from another column.
  const showDropPlaceholder =
    isValidHover && activeDragId != null && !items.some((i) => i.id === activeDragId);

  const borderColor = isInvalidHover
    ? '#ef4444'
    : isValidHover
      ? 'var(--accent)'
      : dragStatus === 'valid'
        ? 'color-mix(in srgb, var(--accent) 55%, var(--border))'
        : 'var(--border)';

  const bgColor = isInvalidHover
    ? 'color-mix(in srgb, #ef4444 8%, var(--bg-secondary))'
    : isValidHover
      ? 'var(--surface-hover)'
      : dragStatus === 'valid'
        ? 'color-mix(in srgb, var(--accent) 5%, var(--bg-secondary))'
        : 'var(--bg-secondary)';

  return (
    <div
      ref={setNodeRef}
      style={{
        flex: '1 1 0',
        minWidth: compact ? 0 : '200px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: bgColor,
        borderRadius: '8px',
        border: `1px solid ${borderColor}`,
        transition: 'background-color 150ms, border-color 150ms, opacity 150ms',
        opacity: dragStatus === 'invalid' && !isOver ? 0.45 : 1,
        overflow: 'hidden',
      }}
    >
      {/* Column header */}
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

      {/* Scrollable card list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          minHeight: 0,
        }}
      >
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <div key={item.id} onClick={() => onCardClick(item)}>
              <CycleBoardCard item={item} isSelected={item.id === selectedItemId} />
            </div>
          ))}
        </SortableContext>

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

      {/* Drop placeholder: rendered outside the scroll area so it's always visible
          at the bottom of the column even when the card list is full */}
      {showDropPlaceholder && (
        <div aria-hidden style={{ padding: '0 8px 8px', flexShrink: 0 }}>
          <div
            style={{
              border: '2px dashed var(--accent)',
              borderRadius: '6px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              color: 'var(--accent)',
              opacity: 0.7,
            }}
          >
            Drop here
          </div>
        </div>
      )}

      {/* Rejection indicator when hovering an invalid target */}
      {isInvalidHover && (
        <div aria-hidden style={{ padding: '0 8px 8px', flexShrink: 0 }}>
          <div
            style={{
              border: '2px dashed #ef4444',
              borderRadius: '6px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              color: '#ef4444',
              opacity: 0.7,
            }}
          >
            Can&apos;t drop here
          </div>
        </div>
      )}
    </div>
  );
}
