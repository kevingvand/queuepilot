import { useEffect, useMemo } from 'react';
import type { Item } from '@queuepilot/core/types';
import { ScrollArea } from '../../components/ui/scroll-area';
import { useUiStore, type FilterState, type SortOrder } from '../../store/ui.store';
import { ItemListHeader } from './ItemListHeader';
import { ItemRow, type ItemWithCounts } from './ItemRow';
import { useItems } from './hooks/useItems';

function sortItems<T extends Item>(items: T[], order: SortOrder): T[] {
  return [...items].sort((a, b) => {
    switch (order) {
      case 'newest': return b.created_at - a.created_at;
      case 'oldest': return a.created_at - b.created_at;
      case 'priority': return (b.priority ?? 0) - (a.priority ?? 0);
      case 'title': return a.title.localeCompare(b.title);
    }
  });
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="h-3 rounded w-3/4 mb-2" style={{ backgroundColor: 'var(--surface-hover)' }} />
          <div className="h-2.5 rounded w-1/2" style={{ backgroundColor: 'var(--surface-hover)' }} />
        </div>
      ))}
    </>
  );
}

function EmptyState({ filter }: { filter: FilterState }) {
  if (filter.q) {
    return (
      <div className="px-4 py-8 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
        No results for &ldquo;{filter.q}&rdquo;
      </div>
    );
  }
  if (filter.status) {
    return (
      <div className="px-4 py-8 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
        No items in {filter.status.replace('_', ' ')}
      </div>
    );
  }
  return (
    <div className="px-4 py-8 text-sm text-center" style={{ color: 'var(--text-muted)' }}>No items yet</div>
  );
}

export function ItemList() {
  const { filterState, selectedItemId, setSelectedItemId, sortOrder, setShortcutsOpen, shortcutsOpen, addDialogOpen, setAddDialogOpen, triggerFocusDetailTitle, setFilterState } = useUiStore();
  const { data: rawItems = [], isLoading } = useItems(filterState);
  const items = useMemo(() => sortItems<ItemWithCounts>(rawItems, sortOrder), [rawItems, sortOrder]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Cmd+K / Ctrl+K always focuses search regardless of active element
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        (document.getElementById('qp-search-input') as HTMLInputElement | null)?.focus();
        return;
      }

      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (shortcutsOpen || addDialogOpen) return;

      switch (e.key) {
        case '/':
          e.preventDefault();
          (document.getElementById('qp-search-input') as HTMLInputElement | null)?.focus();
          return;
        case '?':
          e.preventDefault();
          setShortcutsOpen(true);
          return;
        case 'c':
        case 'C':
          e.preventDefault();
          setAddDialogOpen(true);
          return;
        case 'e':
        case 'E':
          e.preventDefault();
          if (selectedItemId) triggerFocusDetailTitle();
          return;
        case 'Escape':
          e.preventDefault();
          setSelectedItemId(null);
          return;
        case '1':
          e.preventDefault();
          setFilterState({ status: 'inbox' });
          return;
        case '2':
          e.preventDefault();
          setFilterState({ status: 'in_progress' });
          return;
        case '3':
          e.preventDefault();
          setFilterState({ status: 'done' });
          return;
        case '0':
          e.preventDefault();
          setFilterState({});
          return;
      }

      if (e.key !== 'j' && e.key !== 'k' && e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter') return;
      e.preventDefault();

      const currentIndex = items.findIndex((item) => item.id === selectedItemId);

      if (e.key === 'j' || e.key === 'ArrowDown') {
        const nextIndex = currentIndex === -1 ? 0 : Math.min(currentIndex + 1, items.length - 1);
        setSelectedItemId(items[nextIndex]?.id ?? null);
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        const nextIndex = currentIndex <= 0 ? 0 : currentIndex - 1;
        setSelectedItemId(items[nextIndex]?.id ?? null);
      } else if (e.key === 'Enter') {
        if (currentIndex === -1 && items.length > 0) {
          setSelectedItemId(items[0].id);
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [items, selectedItemId, shortcutsOpen, addDialogOpen, setSelectedItemId, setShortcutsOpen, setAddDialogOpen, triggerFocusDetailTitle, setFilterState]);

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <ItemListHeader count={items.length} />
      <ScrollArea className="flex-1">
        {isLoading && <SkeletonRows />}
        {!isLoading && items.length === 0 && <EmptyState filter={filterState} />}
        {!isLoading && items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            selected={selectedItemId === item.id}
            onSelect={setSelectedItemId}
          />
        ))}
      </ScrollArea>
    </div>
  );
}
