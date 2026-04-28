import { useState, useMemo, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import type { Cycle } from '@queuepilot/core/types';
import { useCycles } from './hooks/useCycles';
import { useCycleItems, useCycleTags, useReorderCycleItems, type ItemWithTags } from './hooks/useCycleItems';
import { useCycleBoardItemStatus } from './hooks/useCycleBoardItemStatus';
import { useUiStore } from '../../store/ui.store';
import { CycleBoardCardContent } from './CycleBoardCardContent';
import { CycleBoardColumn } from './CycleBoardColumn';
import type { ColumnDragStatus } from './CycleBoardColumn';
import { CycleBoardHeader } from './CycleBoardHeader';
import { VALID_TRANSITIONS } from '@queuepilot/core/types';
import { resolveTargetStatus, itemStatusToColumn } from './cycleBoardTransitions';

const ALL_COLUMNS = ['todo', 'in_progress', 'review', 'done', 'discarded'] as const;
type ColumnId = (typeof ALL_COLUMNS)[number];

const KEY_TO_STATUS: Record<string, string> = {
  '1': 'todo',
  '2': 'in_progress',
  '3': 'review',
  '4': 'done',
  '5': 'discarded',
};

export function CycleBoard({ cycleId }: { cycleId: string }) {
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const { data: allItems = [] } = useCycleItems(cycleId, selectedTagIds.length > 0 ? selectedTagIds : undefined);
  const { data: cycleTags = [] } = useCycleTags(cycleId);
  const { data: cycles = [] } = useCycles();
  const { mutate: updateStatus } = useCycleBoardItemStatus(cycleId);
  const { mutate: reorderItems } = useReorderCycleItems(cycleId);
  const queryClient = useQueryClient();
  const { setSelectedItemId, selectedItemId } = useUiStore();
  const [search, setSearch] = useState('');
  const [activeItem, setActiveItem] = useState<ItemWithTags | null>(null);
  const [localItems, setLocalItems] = useState<ItemWithTags[]>(allItems);
  const isDragging = useRef(false);
  const isPendingReorder = useRef(false);
  const isPendingStatusUpdate = useRef(false);

  useEffect(() => {
    if (!isDragging.current && !isPendingReorder.current && !isPendingStatusUpdate.current) {
      setLocalItems(allItems);
    }
  }, [allItems]);

  const cycle: Cycle | undefined = cycles.find((c) => c.id === cycleId);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!selectedItemId || !KEY_TO_STATUS[e.key]) return;
      const el = e.target as HTMLElement;
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement ||
        el?.isContentEditable
      ) return;

      const targetStatus = KEY_TO_STATUS[e.key];
      const item = localItems.find((i) => i.id === selectedItemId);
      if (!item || item.status === targetStatus) return;

      const allowed = VALID_TRANSITIONS[item.status] ?? [];
      if (!allowed.includes(targetStatus)) return;

      isPendingStatusUpdate.current = true;
      updateStatus(
        { id: item.id, status: targetStatus, position: null },
        {
          onSettled: () => {
            isPendingStatusUpdate.current = false;
            queryClient.invalidateQueries({ queryKey: ['cycle-items', cycleId] });
          },
        },
      );
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedItemId, localItems, updateStatus]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const filteredItems = useMemo(() => {
    if (!search.trim()) return localItems;
    const q = search.toLowerCase();
    return localItems.filter((item) => item.title.toLowerCase().includes(q));
  }, [localItems, search]);

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
    isDragging.current = true;
    const item = localItems.find((i) => i.id === event.active.id);
    setActiveItem(item ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (search.trim()) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const draggedItem = localItems.find((i) => i.id === activeId);
    if (!draggedItem) return;

    const sourceCol = itemStatusToColumn(draggedItem.status);
    const overItem = localItems.find((i) => i.id === overId);
    const targetCol = overItem ? itemStatusToColumn(overItem.status) : overId;

    if (sourceCol !== targetCol) return;
    if (!overItem) return;

    setLocalItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === activeId);
      const newIndex = prev.findIndex((i) => i.id === overId);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    isDragging.current = false;
    setActiveItem(null);

    if (!over) return;

    const draggedItem = localItems.find((i) => i.id === active.id);
    if (!draggedItem) return;

    let targetColumnId = String(over.id);
    const overItem = localItems.find((i) => i.id === over.id);
    if (overItem) {
      targetColumnId = itemStatusToColumn(overItem.status);
    }

    const sourceColumnId = itemStatusToColumn(draggedItem.status);

    if (targetColumnId === sourceColumnId) {
      if (search.trim()) return;
      const columnStatuses =
        sourceColumnId === 'todo' ? ['inbox', 'todo'] : [sourceColumnId];
      const columnIds = localItems
        .filter((i) => columnStatuses.includes(i.status))
        .map((i) => i.id);
      isPendingReorder.current = true;
      reorderItems(
        { column: sourceColumnId, ids: columnIds },
        {
          onSettled: () => {
            isPendingReorder.current = false;
            queryClient.invalidateQueries({ queryKey: ['cycle-items', cycleId] });
          },
        },
      );
      return;
    }

    const targetStatus = resolveTargetStatus(targetColumnId, draggedItem.status);
    if (!targetStatus) return;
    if (targetStatus === draggedItem.status) return;

    const allowed = VALID_TRANSITIONS[draggedItem.status] ?? [];
    if (!allowed.includes(targetStatus)) return;

    isPendingStatusUpdate.current = true;
    updateStatus(
      { id: draggedItem.id, status: targetStatus, position: null },
      {
        onSettled: () => {
          isPendingStatusUpdate.current = false;
          queryClient.invalidateQueries({ queryKey: ['cycle-items', cycleId] });
        },
      },
    );
  }

  const todoItems = filteredItems.filter((i) => i.status === 'todo' || i.status === 'inbox');
  const inProgressItems = filteredItems.filter((i) => i.status === 'in_progress');
  const reviewItems = filteredItems.filter((i) => i.status === 'review');
  const doneItems = filteredItems.filter((i) => i.status === 'done');
  const discardedItems = filteredItems.filter((i) => i.status === 'discarded');

  const activeDragId = activeItem?.id ?? null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <CycleBoardHeader
        cycle={cycle}
        search={search}
        onSearchChange={setSearch}
        tags={cycleTags}
        selectedTagIds={selectedTagIds}
        onTagSelect={(tagId) =>
          setSelectedTagIds((prev) =>
            prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId],
          )
        }
      />

      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 flex gap-3 items-stretch">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
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

          {/* Done + Cancelled share one flex unit, stacked vertically */}
          <div className="flex-1 min-w-[200px] flex flex-col gap-2">
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

          <DragOverlay dropAnimation={null}>
            {activeItem ? <CycleBoardCardContent item={activeItem} lifted /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

