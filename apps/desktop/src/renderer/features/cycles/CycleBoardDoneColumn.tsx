import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Item } from '@queuepilot/core/types';
import { CycleBoardCard } from './CycleBoardCard';

function SubBlock({
  label,
  accent,
  count,
  items,
  emptyText,
  onCardClick,
}: {
  label: string;
  accent: string;
  count: number;
  items: Item[];
  emptyText: string;
  onCardClick: (item: Item) => void;
}) {
  return (
    <div
      style={{
        borderRadius: '6px',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-primary)',
      }}
    >
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--surface)',
        }}
      >
        <span className={`text-xs font-semibold ${accent}`}>{label}</span>
        <span
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '10px',
            padding: '1px 7px',
          }}
        >
          {count}
        </span>
      </div>
      <div
        style={{
          padding: '6px',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
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
              padding: '10px 8px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '12px',
            }}
          >
            {emptyText}
          </div>
        )}
      </div>
    </div>
  );
}

export function CycleBoardDoneColumn({
  items,
  onCardClick,
}: {
  items: Item[];
  onCardClick: (item: Item) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'done' });
  const doneItems = items.filter((i) => i.status === 'done');
  const discardedItems = items.filter((i) => i.status === 'discarded');

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
        <span className="text-sm font-semibold text-green-400">Done / Cancelled</span>
        <span
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            backgroundColor: 'var(--surface)',
            borderRadius: '10px',
            padding: '1px 7px',
          }}
        >
          {doneItems.length} · {discardedItems.length}
        </span>
      </div>

      {/* Two distinct sub-blocks */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <SubBlock
          label="Done"
          accent="text-green-400"
          count={doneItems.length}
          items={doneItems}
          emptyText="No done items"
          onCardClick={onCardClick}
        />
        <SubBlock
          label="Cancelled"
          accent="text-gray-400"
          count={discardedItems.length}
          items={discardedItems}
          emptyText="No cancelled items"
          onCardClick={onCardClick}
        />
      </div>
    </div>
  );
}
