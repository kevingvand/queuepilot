import { useEffect, useMemo } from 'react';
import type { Item } from '@queuepilot/core/types';
import { ScrollArea } from '../../components/ui/scroll-area';
import { useUiStore, type FilterState, type SortOrder } from '../../store/ui.store';
import { ItemListHeader } from './ItemListHeader';
import { ItemRow } from './ItemRow';
import { useItems } from './hooks/useItems';

function sortItems(items: Item[], order: SortOrder): Item[] {
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
  const { filterState, selectedItemId, setSelectedItemId, sortOrder } = useUiStore();
  const { data: rawItems = [], isLoading } = useItems(filterState);
  const items = useMemo(() => sortItems(rawItems, sortOrder), [rawItems, sortOrder]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      if (e.key !== 'j' && e.key !== 'k' && e.key !== 'Enter') return;

      e.preventDefault();

      if (e.key === 'Enter') return;

      const currentIndex = items.findIndex((item) => item.id === selectedItemId);

      if (e.key === 'j') {
        const nextIndex = currentIndex === -1 ? 0 : Math.min(currentIndex + 1, items.length - 1);
        setSelectedItemId(items[nextIndex]?.id ?? null);
      } else {
        const nextIndex = currentIndex <= 0 ? 0 : currentIndex - 1;
        setSelectedItemId(items[nextIndex]?.id ?? null);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [items, selectedItemId, setSelectedItemId]);

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
