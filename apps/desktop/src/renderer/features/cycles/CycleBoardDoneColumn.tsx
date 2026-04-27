import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Item } from '@queuepilot/core/types';
import { CycleBoardCard } from './CycleBoardCard';

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
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
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
          {doneItems.length} done · {discardedItems.length} cancelled
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
        <SortableContext items={doneItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {doneItems.map((item) => (
            <div key={item.id} onClick={() => onCardClick(item)}>
              <CycleBoardCard item={item} />
            </div>
          ))}
        </SortableContext>
        {doneItems.length === 0 && (
          <div
            style={{
              padding: '8px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '12px',
            }}
          >
            No done items
          </div>
        )}
        {discardedItems.length > 0 && (
          <>
            <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '8px 0' }} />
            <div
              style={{
                fontSize: '11px',
                fontWeight: 500,
                color: 'var(--text-muted)',
                paddingLeft: '4px',
                marginBottom: '4px',
              }}
            >
              Cancelled
            </div>
            <SortableContext
              items={discardedItems.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {discardedItems.map((item) => (
                <div key={item.id} onClick={() => onCardClick(item)}>
                  <CycleBoardCard item={item} />
                </div>
              ))}
            </SortableContext>
          </>
        )}
      </div>
    </div>
  );
}
