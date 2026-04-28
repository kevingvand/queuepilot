import { useDroppable, useDndContext } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import type { ItemWithTags } from './hooks/useCycleItems';
import { CycleBoardCard } from './CycleBoardCard';

export type ColumnDragStatus = 'valid' | 'invalid' | 'source' | undefined;

type ColumnVisualState = 'default' | 'source' | 'valid' | 'valid-hover' | 'invalid' | 'invalid-hover';

const columnVariants = cva('flex flex-col rounded-lg border transition-all duration-150 overflow-hidden', {
  variants: {
    visualState: {
      default:        'border-border bg-muted',
      source:         'border-border bg-muted',
      valid:          'border-primary/50 bg-muted',
      'valid-hover':  'border-primary bg-accent',
      'invalid-hover':'border-danger bg-danger/10',
      invalid:        'border-border bg-muted opacity-45',
    },
  },
  defaultVariants: { visualState: 'default' },
});

function toVisualState(dragStatus: ColumnDragStatus, isOver: boolean): ColumnVisualState {
  if (!dragStatus) return 'default';
  if (dragStatus === 'source') return 'source';
  if (dragStatus === 'invalid') return isOver ? 'invalid-hover' : 'invalid';
  if (dragStatus === 'valid') return isOver ? 'valid-hover' : 'valid';
  return 'default';
}

interface CycleBoardColumnProps {
  columnId: string;
  label: string;
  accent: string;
  items: ItemWithTags[];
  emptyText?: string;
  activeDragId?: string | null;
  dragStatus?: ColumnDragStatus;
  selectedItemId?: string | null;
  compact?: boolean;
  onCardClick: (item: ItemWithTags) => void;
}

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
}: CycleBoardColumnProps) {
  const { setNodeRef } = useDroppable({ id: columnId });
  const { over } = useDndContext();

  const isOver =
    over?.id === columnId || (over?.id != null && items.some((i) => i.id === over.id));

  const visualState = toVisualState(dragStatus, isOver);

  const showDropPlaceholder =
    (visualState === 'valid-hover') &&
    activeDragId != null &&
    !items.some((i) => i.id === activeDragId);

  const showInvalidBanner = visualState === 'invalid-hover';

  return (
    <div
      ref={setNodeRef}
      className={cn(
        columnVariants({ visualState }),
        'flex-1',
        compact ? 'min-w-0' : 'min-w-[200px]',
      )}
    >
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <span className={cn('text-sm font-semibold', accent)}>{label}</span>
        <span className="text-[11px] text-muted-foreground bg-card rounded-full px-[7px] py-[1px]">
          {items.length}
        </span>
      </div>

      <div
        aria-hidden
        className="shrink-0 overflow-hidden transition-all duration-150"
        style={{
          maxHeight: showDropPlaceholder || showInvalidBanner ? '52px' : '0px',
          opacity: showDropPlaceholder || showInvalidBanner ? 1 : 0,
        }}
      >
        <div
          className={cn(
            'm-2 mt-2 rounded-md h-9 flex items-center justify-center gap-1.5 text-[11px] font-semibold tracking-wide',
            showInvalidBanner
              ? 'bg-danger/10 border border-dashed border-danger text-danger'
              : 'bg-primary/10 border border-dashed border-primary text-primary',
          )}
        >
          {showInvalidBanner ? (
            <><span className="text-[13px]">✕</span> Can&apos;t drop here</>
          ) : (
            <><span className="text-[13px]">↓</span> Drop here</>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5 min-h-0">
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <div key={item.id} onClick={() => onCardClick(item)}>
              <CycleBoardCard item={item} isSelected={item.id === selectedItemId} />
            </div>
          ))}
        </SortableContext>

        {items.length === 0 && !showDropPlaceholder && !showInvalidBanner && (
          <div className="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground text-xs leading-relaxed">
            {emptyText}
          </div>
        )}
      </div>
    </div>
  );
}

