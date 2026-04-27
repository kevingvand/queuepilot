import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import type { Item } from '@queuepilot/core/types';
import type { Cycle } from '@queuepilot/core/types';
import { useCycleItems, useUpdateItemStatus } from '../items/hooks/useItems';
import { useCycles } from './hooks/useCycles';
import { useUiStore } from '../../store/ui.store';
import { CycleBoardCard } from './CycleBoardCard';
import { CycleBoardColumn } from './CycleBoardColumn';
import { CycleBoardDoneColumn } from './CycleBoardDoneColumn';
import { CycleBoardHeader } from './CycleBoardHeader';
import { ConfirmDoneDialog } from './ConfirmDoneDialog';
import { resolveTargetStatus, itemStatusToColumn, VALID_TRANSITIONS } from './cycleBoardTransitions';

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

  const todoItems = filteredItems.filter((i) => i.status === 'todo' || i.status === 'inbox');
  const inProgressItems = filteredItems.filter((i) => i.status === 'in_progress');
  const reviewItems = filteredItems.filter((i) => i.status === 'review');
  const doneItems = filteredItems.filter((i) => i.status === 'done' || i.status === 'discarded');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <CycleBoardHeader cycle={cycle} search={search} onSearchChange={setSearch} />

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
          <CycleBoardColumn
            columnId="todo"
            label="Todo"
            accent="text-blue-400"
            items={todoItems}
            onCardClick={(item) => setSelectedItemId(item.id)}
          />
          <CycleBoardColumn
            columnId="in_progress"
            label="In Progress"
            accent="text-amber-400"
            items={inProgressItems}
            onCardClick={(item) => setSelectedItemId(item.id)}
          />
          <CycleBoardColumn
            columnId="review"
            label="Review"
            accent="text-indigo-400"
            items={reviewItems}
            onCardClick={(item) => setSelectedItemId(item.id)}
          />
          <CycleBoardDoneColumn
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
