import { useQuery } from '@tanstack/react-query';
import type { Item } from '@queuepilot/core/types';
import { useApi } from '../../hooks/useApi';
import { useUiStore } from '../../store/ui.store';

export function StatusBar() {
  const { filterState, setShortcutsOpen } = useUiStore();
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
      className="border-t flex items-center px-4 gap-4"
      style={{
        height: '28px',
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border)',
        color: 'var(--text-muted)',
        fontSize: '11px',
      }}
    >
      <button
        onClick={() => setShortcutsOpen(true)}
        title="Keyboard shortcuts (?)"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)',
          fontSize: '10px',
          fontWeight: '600',
          cursor: 'pointer',
          backgroundColor: 'transparent',
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ?
      </button>
      <span style={{ flex: 1 }} />
      <span>{count} items</span>
    </div>
  );
}
