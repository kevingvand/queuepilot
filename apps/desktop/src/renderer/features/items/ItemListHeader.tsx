import { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';
import { useUiStore, type SortOrder } from '../../store/ui.store';

const STATUS_PILLS: Array<{ label: string; value: string | undefined }> = [
  { label: 'All', value: undefined },
  { label: 'Inbox', value: 'inbox' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Done', value: 'done' },
];

const SORT_OPTIONS: Array<{ label: string; value: SortOrder }> = [
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Priority', value: 'priority' },
  { label: 'Title', value: 'title' },
];

export function ItemListHeader({ count }: { count: number }) {
  const { filterState, setFilterState, sortOrder, setSortOrder } = useUiStore();
  const [localQ, setLocalQ] = useState(filterState.q ?? '');
  const filterStateRef = useRef(filterState);
  filterStateRef.current = filterState;

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterState({ ...filterStateRef.current, q: localQ || undefined });
    }, 300);
    return () => clearTimeout(timer);
  }, [localQ, setFilterState]);

  return (
    <div className="border-b border-border">
      <div className="flex items-center gap-2 px-3 py-2">
        <input
          type="text"
          placeholder="Search…"
          value={localQ}
          onChange={(e) => setLocalQ(e.target.value)}
          className="flex-1 min-w-0 bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground rounded px-2.5 py-1 outline-none focus:ring-1 focus:ring-ring"
        />
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as SortOrder)}
          className="bg-muted/50 text-xs text-muted-foreground rounded px-1.5 py-1 outline-none cursor-pointer"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground shrink-0">{count} items</span>
      </div>
      <div className="flex gap-1 px-3 pb-2">
        {STATUS_PILLS.map((pill) => (
          <button
            key={pill.label}
            onClick={() => setFilterState({ ...filterState, status: pill.value })}
            className={cn(
              'px-2.5 py-0.5 rounded-full text-xs transition-colors',
              filterState.status === pill.value
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground hover:bg-accent/50',
            )}
          >
            {pill.label}
          </button>
        ))}
      </div>
    </div>
  );
}
