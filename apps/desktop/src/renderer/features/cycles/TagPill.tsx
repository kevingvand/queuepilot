import type { Tag } from '@queuepilot/core/types';

interface TagPillProps {
  tag: Pick<Tag, 'id' | 'name' | 'color'>;
}

export function TagPill({ tag }: TagPillProps) {
  return (
    <span
      className="inline-flex items-center gap-[3px] px-1.5 py-[1px] rounded-full text-[10px] font-medium leading-snug"
      style={{
        backgroundColor: `${tag.color}22`,
        color: tag.color,
        border: `1px solid ${tag.color}55`,
      }}
    >
      <span
        className="w-[5px] h-[5px] rounded-full shrink-0"
        style={{ backgroundColor: tag.color }}
      />
      {tag.name}
    </span>
  );
}
