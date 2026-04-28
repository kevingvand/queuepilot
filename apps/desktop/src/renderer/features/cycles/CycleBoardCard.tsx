import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../../lib/utils';
import type { ItemWithTags } from './hooks/useCycleItems';
import { CycleBoardCardContent } from './CycleBoardCardContent';

interface CycleBoardCardProps {
  item: ItemWithTags;
  isSelected?: boolean;
}

export function CycleBoardCard({ item, isSelected = false }: CycleBoardCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn('transition-opacity', isDragging && 'opacity-30')}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <CycleBoardCardContent
        item={item}
        dragListeners={listeners}
        dragAttributes={attributes}
        selected={isSelected}
      />
    </div>
  );
}
