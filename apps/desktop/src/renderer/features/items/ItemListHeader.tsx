import { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
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
  const { filterState, setFilterState, sortOrder, setSortOrder, setAddDialogOpen } = useUiStore();
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
    <div style={{ borderBottomColor: 'var(--border)', borderBottomWidth: '1px' }}>
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            placeholder="Search…"
            value={localQ}
            onChange={(e) => setLocalQ(e.target.value)}
            className="w-full text-sm rounded px-2.5 py-1.5 outline-none transition-colors"
            style={{
              backgroundColor: 'var(--surface-hover)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border)',
              borderWidth: '1px',
            }}
            onFocus={(e) => {
              (e.target as HTMLInputElement).style.borderColor = 'var(--accent)';
              (e.target as HTMLInputElement).style.boxShadow = '0 0 0 2px rgba(99, 102, 241, 0.1)';
            }}
            onBlur={(e) => {
              (e.target as HTMLInputElement).style.borderColor = 'var(--border)';
              (e.target as HTMLInputElement).style.boxShadow = 'none';
            }}
          />
        </div>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as SortOrder)}
          className="text-xs rounded px-2 py-1.5 outline-none cursor-pointer transition-colors"
          style={{
            backgroundColor: 'var(--surface-hover)',
            color: 'var(--text-secondary)',
            borderColor: 'var(--border)',
            borderWidth: '1px',
          }}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button
          onClick={() => setAddDialogOpen(true)}
          title="New item (C)"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium transition-colors shrink-0"
          style={{
            backgroundColor: 'var(--accent)',
            color: '#ffffff',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--accent-hover)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--accent)';
          }}
        >
          <Plus size={12} />
          <span>New</span>
        </button>
      </div>
      <div className="flex gap-1 px-3 pb-2">
        {STATUS_PILLS.map((pill) => (
          <button
            key={pill.label}
            onClick={() => setFilterState({ ...filterState, status: pill.value })}
            className="px-2.5 py-0.5 rounded-full text-xs transition-colors font-medium"
            style={{
              backgroundColor: filterState.status === pill.value ? 'var(--accent)' : 'var(--surface-hover)',
              color: filterState.status === pill.value ? '#ffffff' : 'var(--text-secondary)',
            }}
          >
            {pill.label}
          </button>
        ))}
      </div>
    </div>
  );
}
