import { cva } from 'class-variance-authority';
import { GripVertical } from 'lucide-react';
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import type { Tag } from '@queuepilot/core/types';
import { cn } from '../../lib/utils';
import type { ItemWithTags } from './hooks/useCycleItems';
import { TagPill } from './TagPill';

const PRIORITY_BORDER_CLASS = [
  'border-l-transparent',
  'border-l-blue-500',
  'border-l-amber-400',
  'border-l-orange-500',
  'border-l-red-500',
] as const;

const cardVariants = cva(
  'border border-border border-l-[3px] rounded-md px-3 py-2.5 select-none transition-colors',
  {
    variants: {
      selected: {
        true: 'bg-primary/[0.08] shadow-[inset_0_0_0_2px_var(--accent)]',
        false: 'bg-card',
      },
      lifted: {
        true: 'shadow-2xl rotate-[1.5deg] scale-[1.03] cursor-grabbing',
        false: 'cursor-pointer',
      },
    },
    defaultVariants: { selected: false, lifted: false },
  },
);

interface CycleBoardCardContentProps {
  item: ItemWithTags;
  dragListeners?: DraggableSyntheticListeners;
  dragAttributes?: DraggableAttributes;
  lifted?: boolean;
  selected?: boolean;
}

export function CycleBoardCardContent({
  item,
  dragListeners,
  dragAttributes,
  lifted = false,
  selected = false,
}: CycleBoardCardContentProps) {
  const priorityClass = PRIORITY_BORDER_CLASS[Math.min(item.priority ?? 0, 4)] ?? 'border-l-transparent';

  return (
    <div className={cn(cardVariants({ selected, lifted }), priorityClass)}>
      <div className="flex items-start gap-1.5">
        <button
          {...dragAttributes}
          {...dragListeners}
          onClick={(e) => e.stopPropagation()}
          aria-label="Drag to reorder"
          className={cn(
            'text-muted-foreground shrink-0 mt-[1px] bg-transparent border-0 p-0 flex items-center',
            lifted ? 'cursor-grabbing' : 'cursor-grab',
          )}
        >
          <GripVertical size={14} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-snug line-clamp-2 m-0">
            {item.title}
          </p>
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-[3px] mt-1.5">
              {item.tags.map((tag: Pick<Tag, 'id' | 'name' | 'color'>) => (
                <TagPill key={tag.id} tag={tag} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
