import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Item } from '@queuepilot/core/types';
import { CycleBoardCard } from './CycleBoardCard';

export function CycleBoardColumn({
  columnId,
  label,
  accent,
  items,
  onCardClick,
}: {
  columnId: string;
  label: string;
  accent: string;
  items: Item[];
  onCardClick: (item: Item) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });

  return (
    <div
      ref={setNodeRef}
      style={{
        flex: '1 1 0',
        minWidth: '200px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: isOver ? 'var(--surface-hover)' : 'var(--bg-secondary)',
        borderRadius: '8px',
        border: '1px solid var(--border)',
        transition: 'background-color 150ms',
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
        {items.length === 0 && (
          <div
            style={{
              padding: '24px 16px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '12px',
            }}
          >
            Drop items here
          </div>
        )}
      </div>
    </div>
  );
}
