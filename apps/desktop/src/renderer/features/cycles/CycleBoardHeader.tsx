import { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import type { Cycle, Tag } from '@queuepilot/core/types';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
const searchShortcut = isMac ? '⌘K' : 'Ctrl+K';

interface CycleBoardHeaderProps {
  cycle: Cycle | undefined;
  search: string;
  onSearchChange: (value: string) => void;
  tags?: Tag[];
  selectedTagIds?: string[];
  onTagSelect: (tagId: string) => void;
}

export function CycleBoardHeader({
  cycle,
  search,
  onSearchChange,
  tags = [],
  selectedTagIds = [],
  onTagSelect,
}: CycleBoardHeaderProps) {
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isModKey = isMac ? e.metaKey : e.ctrlKey;
      if (!isModKey || e.key !== 'k') return;
      e.preventDefault();
      searchRef.current?.focus();
      searchRef.current?.select();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="px-4 py-4 border-b border-border shrink-0">
      {cycle ? (
        <>
          <h2 className="text-xl font-semibold text-foreground m-0">{cycle.name}</h2>
          {cycle.goal && (
            <p className="text-sm text-muted-foreground mt-0.5 mb-2">{cycle.goal}</p>
          )}
        </>
      ) : (
        <h2 className="text-xl font-semibold text-foreground mb-2">Cycle Board</h2>
      )}

      <div className={cn('relative', cycle?.goal ? 'mt-0' : 'mt-1')}>
        <input
          ref={searchRef}
          placeholder="Search…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            'w-full bg-muted border border-border rounded px-3 py-1.5 text-sm text-foreground',
            'placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-shadow',
            !search ? 'pr-14' : 'pr-3',
          )}
        />
        {!search && (
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[11px] leading-none px-1 py-0.5 rounded-sm bg-background text-muted-foreground border border-border font-[inherit]">
            {searchShortcut}
          </kbd>
        )}
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {tags.map((tag) => {
            const active = selectedTagIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                onClick={() => onTagSelect(tag.id)}
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium cursor-pointer transition-colors border',
                  active ? 'text-foreground' : 'border-border bg-accent text-muted-foreground hover:text-foreground',
                )}
                style={active ? { borderColor: tag.color, backgroundColor: `${tag.color}22` } : undefined}
              >
                <span
                  className="w-[6px] h-[6px] rounded-full shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

