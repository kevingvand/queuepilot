import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Item } from '@queuepilot/core/types';
import type { Cycle } from '@queuepilot/core/types';
import { useCycleItems, useUpdateItemStatus } from './hooks/useItems';
import { useCycles } from './hooks/useCycles';
import { useUiStore } from '../../store/ui.store';
import { CycleBoardCard } from './CycleBoardCard';
import { ConfirmDoneDialog } from './ConfirmDoneDialog';

const VALID_TRANSITIONS: Record<string, string[]> = {
  inbox: ['todo', 'discarded'],
  todo: ['in_progress', 'discarded'],
  in_progress: ['review', 'todo', 'discarded'],
  review: ['done', 'in_progress', 'discarded'],
  done: [],
  discarded: [],
};

function resolveTargetStatus(columnId: string, draggedStatus: string): string | null {
  if (columnId === 'todo') return 'todo';
  if (columnId === 'in_progress') return 'in_progress';
  if (columnId === 'review') return 'review';
  if (columnId === 'done') {
    if (VALID_TRANSITIONS[draggedStatus]?.includes('done')) return 'done';
    if (VALID_TRANSITIONS[draggedStatus]?.includes('discarded')) return 'discarded';
    return null;
  }
  return null;
}

function itemStatusToColumn(status: string): string {
  if (status === 'todo') return 'todo';
  if (status === 'in_progress') return 'in_progress';
  if (status === 'review') return 'review';
  if (status === 'done' || status === 'discarded') return 'done';
  return 'todo';
}

function DroppableColumn({
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
        minWidth: '240px',
        maxWidth: '320px',
        flexShrink: 0,
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

function DoneColumn({
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
        minWidth: '240px',
        maxWidth: '320px',
        flexShrink: 0,
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
        <span className="text-sm font-semibold text-green-400">Done</span>
        <span
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            backgroundColor: 'var(--surface)',
            borderRadius: '10px',
            padding: '1px 7px',
          }}
        >
          {doneItems.length + discardedItems.length}
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

export function CycleBoard({ cycleId }: { cycleId: string }) {
  const { data: allItems = [] } = useCycleItems(cycleId);
  const { data: cycles = [] } = useCycles();
  const { mutate: updateStatus } = useUpdateItemStatus();
  const { setSelectedItemId } = useUiStore();
  const [search, setSearch] = useState('');
  const [activeItem, setActiveItem] = useState<Item | null>(null);
  const [confirmPendingItem, setConfirmPendingItem] = useState<Item | null>(null);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const cycle: Cycle | undefined = cycles.find((c) => c.id === cycleId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const filteredItems = useMemo(() => {
    if (!search.trim()) return allItems;
    const q = search.toLowerCase();
    return allItems.filter((item) => item.title.toLowerCase().includes(q));
  }, [allItems, search]);

  function handleDragStart(event: DragStartEvent) {
    const item = allItems.find((i) => i.id === event.active.id);
    setActiveItem(item ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveItem(null);
    const { active, over } = event;
    if (!over) return;

    const draggedItem = allItems.find((i) => i.id === active.id);
    if (!draggedItem) return;

    // over.id could be a column id or another card id — resolve to column
    let targetColumnId = String(over.id);
    const overItem = allItems.find((i) => i.id === over.id);
    if (overItem) {
      targetColumnId = itemStatusToColumn(overItem.status);
    }

    const targetStatus = resolveTargetStatus(targetColumnId, draggedItem.status);
    if (!targetStatus) return;
    if (targetStatus === draggedItem.status) return;

    const allowed = VALID_TRANSITIONS[draggedItem.status] ?? [];
    if (!allowed.includes(targetStatus)) return;

    // review → done requires confirmation
    if (draggedItem.status === 'review' && targetStatus === 'done') {
      setConfirmPendingItem(draggedItem);
      setPendingStatus('done');
      return;
    }

    updateStatus({ id: draggedItem.id, status: targetStatus });
  }

  function handleConfirmDone() {
    if (confirmPendingItem && pendingStatus) {
      updateStatus({ id: confirmPendingItem.id, status: pendingStatus });
    }
    setConfirmPendingItem(null);
    setPendingStatus(null);
  }

  function handleCancelDone() {
    setConfirmPendingItem(null);
    setPendingStatus(null);
  }

  const todoItems = filteredItems.filter((i) => i.status === 'todo');
  const inProgressItems = filteredItems.filter((i) => i.status === 'in_progress');
  const reviewItems = filteredItems.filter((i) => i.status === 'review');
  const doneItems = filteredItems.filter(
    (i) => i.status === 'done' || i.status === 'discarded',
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {cycle ? (
          <>
            <h2
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              {cycle.name}
            </h2>
            {cycle.goal && (
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  marginTop: '2px',
                  marginBottom: '8px',
                }}
              >
                {cycle.goal}
              </p>
            )}
          </>
        ) : (
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: '0 0 8px 0',
            }}
          >
            Cycle Board
          </h2>
        )}
        <input
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            color: 'var(--text-primary)',
            fontSize: '13px',
            outline: 'none',
            marginTop: cycle?.goal ? '0' : '4px',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Board columns */}
      <div
        style={{
          flex: 1,
          overflowX: 'auto',
          overflowY: 'hidden',
          padding: '16px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
        }}
      >
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <DroppableColumn
            columnId="todo"
            label="Todo"
            accent="text-blue-400"
            items={todoItems}
            onCardClick={(item) => setSelectedItemId(item.id)}
          />
          <DroppableColumn
            columnId="in_progress"
            label="In Progress"
            accent="text-amber-400"
            items={inProgressItems}
            onCardClick={(item) => setSelectedItemId(item.id)}
          />
          <DroppableColumn
            columnId="review"
            label="Review"
            accent="text-indigo-400"
            items={reviewItems}
            onCardClick={(item) => setSelectedItemId(item.id)}
          />
          <DoneColumn
            items={doneItems}
            onCardClick={(item) => setSelectedItemId(item.id)}
          />
          <DragOverlay>
            {activeItem ? <CycleBoardCard item={activeItem} isDragOverlay /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      <ConfirmDoneDialog
        item={confirmPendingItem}
        onConfirm={handleConfirmDone}
        onCancel={handleCancelDone}
      />
    </div>
  );
}
