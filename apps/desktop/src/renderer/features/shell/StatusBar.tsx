import { useQuery } from '@tanstack/react-query';
import type { Item } from '@queuepilot/core/types';
import { useApi } from '../../hooks/useApi';
import { useUiStore } from '../../store/ui.store';

export function StatusBar() {
  const { filterState } = useUiStore();
  const api = useApi();

  const { data: items } = useQuery({
    queryKey: ['items', filterState],
    queryFn: async () => {
      const res = await api.items.list(filterState);
      return res.data as Item[];
    },
  });

  const count = items?.length ?? 0;

  return (
    <div
      className="h-6 border-t flex items-center px-4 text-xs gap-4"
      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
    >
      <span>{count} items</span>
      <span className="ml-auto">⌘K</span>
    </div>
  );
}
