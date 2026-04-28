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
import { CycleBoardCardContent } from './CycleBoardCard';
import { CycleBoardColumn } from './CycleBoardColumn';
import type { ColumnDragStatus } from './CycleBoardColumn';
import { CycleBoardHeader } from './CycleBoardHeader';
import { resolveTargetStatus, itemStatusToColumn, VALID_TRANSITIONS } from './cycleBoardTransitions';

const ALL_COLUMNS = ['todo', 'in_progress', 'review', 'done', 'discarded'] as const;
type ColumnId = (typeof ALL_COLUMNS)[number];

export function CycleBoard({ cycleId }: { cycleId: string }) {
  const { data: allItems = [] } = useCycleItems(cycleId);
  const { data: cycles = [] } = useCycles();
  const { mutate: updateStatus } = useUpdateItemStatus();
  const { setSelectedItemId, selectedItemId } = useUiStore();
  const [search, setSearch] = useState('');
  const [activeItem, setActiveItem] = useState<Item | null>(null);

  const cycle: Cycle | undefined = cycles.find((c) => c.id === cycleId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const filteredItems = useMemo(() => {
    if (!search.trim()) return allItems;
    const q = search.toLowerCase();
    return allItems.filter((item) => item.title.toLowerCase().includes(q));
  }, [allItems, search]);

  /** Per-column drag status: computed once when a drag starts. */
  const columnDragStatus = useMemo((): Record<ColumnId, ColumnDragStatus> | null => {
    if (!activeItem) return null;
    const sourceCol = itemStatusToColumn(activeItem.status) as ColumnId;
    const allowed = VALID_TRANSITIONS[activeItem.status] ?? [];
    return Object.fromEntries(
      ALL_COLUMNS.map((col) => {
        if (col === sourceCol) return [col, 'source'];
        const target = resolveTargetStatus(col, activeItem.status);
        const isValid = target !== null && allowed.includes(target);
        return [col, isValid ? 'valid' : 'invalid'];
      }),
    ) as Record<ColumnId, ColumnDragStatus>;
  }, [activeItem]);

  function getDragStatus(col: ColumnId): ColumnDragStatus {
    return columnDragStatus?.[col];
  }

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

    updateStatus({ id: draggedItem.id, status: targetStatus });
  }

  const todoItems = filteredItems.filter((i) => i.status === 'todo' || i.status === 'inbox');
  const inProgressItems = filteredItems.filter((i) => i.status === 'in_progress');
  const reviewItems = filteredItems.filter((i) => i.status === 'review');
  const doneItems = filteredItems.filter((i) => i.status === 'done');
  const discardedItems = filteredItems.filter((i) => i.status === 'discarded');

  const activeDragId = activeItem?.id ?? null;

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
          alignItems: 'stretch',
        }}
      >
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <CycleBoardColumn
            columnId="todo"
            label="Todo"
            accent="text-blue-400"
            items={todoItems}
            activeDragId={activeDragId}
            dragStatus={getDragStatus('todo')}
            selectedItemId={selectedItemId}
            emptyText="No items yet — add some to get started"
            onCardClick={(item) => setSelectedItemId(item.id)}
          />
          <CycleBoardColumn
            columnId="in_progress"
            label="In Progress"
            accent="text-amber-400"
            items={inProgressItems}
            activeDragId={activeDragId}
            dragStatus={getDragStatus('in_progress')}
            selectedItemId={selectedItemId}
            emptyText="Pick something from Todo to begin"
            onCardClick={(item) => setSelectedItemId(item.id)}
          />
          <CycleBoardColumn
            columnId="review"
            label="Review"
            accent="text-indigo-400"
            items={reviewItems}
            activeDragId={activeDragId}
            dragStatus={getDragStatus('review')}
            selectedItemId={selectedItemId}
            emptyText="Finish an item to move it here"
            onCardClick={(item) => setSelectedItemId(item.id)}
          />

          {/* Archive: Done (top) + Cancelled (bottom), sharing one flex unit */}
          <div
            style={{
              flex: '1 1 0',
              minWidth: '200px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <CycleBoardColumn
              columnId="done"
              label="Done"
              accent="text-green-400"
              items={doneItems}
              activeDragId={activeDragId}
              dragStatus={getDragStatus('done')}
              selectedItemId={selectedItemId}
              emptyText="Reviewed items land here"
              compact
              onCardClick={(item) => setSelectedItemId(item.id)}
            />
            <CycleBoardColumn
              columnId="discarded"
              label="Cancelled"
              accent="text-muted-foreground"
              items={discardedItems}
              activeDragId={activeDragId}
              dragStatus={getDragStatus('discarded')}
              selectedItemId={selectedItemId}
              emptyText="Nothing cancelled — great work!"
              compact
              onCardClick={(item) => setSelectedItemId(item.id)}
            />
          </div>

          {/* No drop animation — optimistic updates make the move instant */}
          <DragOverlay dropAnimation={null}>
            {activeItem ? <CycleBoardCardContent item={activeItem} lifted /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
