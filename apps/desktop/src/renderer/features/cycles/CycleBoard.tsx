import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import type { Item } from '@queuepilot/core/types';
import type { Cycle } from '@queuepilot/core/types';
import { useCycleItems, useUpdateItemStatus } from '../items/hooks/useItems';
import { useCycles } from './hooks/useCycles';
import { useUiStore } from '../../store/ui.store';
import { CycleBoardCardContent } from './CycleBoardCard';
import { CycleBoardColumn } from './CycleBoardColumn';
import { CycleBoardHeader } from './CycleBoardHeader';
import { resolveTargetStatus, itemStatusToColumn, VALID_TRANSITIONS } from './cycleBoardTransitions';

const dropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: '0.3' } },
  }),
};

export function CycleBoard({ cycleId }: { cycleId: string }) {
  const { data: allItems = [] } = useCycleItems(cycleId);
  const { data: cycles = [] } = useCycles();
  const { mutate: updateStatus } = useUpdateItemStatus();
  const { setSelectedItemId } = useUiStore();
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
            emptyText="No items yet — add some to get started"
            onCardClick={(item) => setSelectedItemId(item.id)}
          />
          <CycleBoardColumn
            columnId="in_progress"
            label="In Progress"
            accent="text-amber-400"
            items={inProgressItems}
            activeDragId={activeDragId}
            emptyText="Pick something from Todo to begin"
            onCardClick={(item) => setSelectedItemId(item.id)}
          />
          <CycleBoardColumn
            columnId="review"
            label="Review"
            accent="text-indigo-400"
            items={reviewItems}
            activeDragId={activeDragId}
            emptyText="Finish an item to move it here"
            onCardClick={(item) => setSelectedItemId(item.id)}
          />

          {/* Archive area: Done (top) + Cancelled (bottom) share one column's flex unit */}
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
              emptyText="Nothing cancelled — great work!"
              compact
              onCardClick={(item) => setSelectedItemId(item.id)}
            />
          </div>

          <DragOverlay dropAnimation={dropAnimation}>
            {activeItem ? <CycleBoardCardContent item={activeItem} lifted /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
