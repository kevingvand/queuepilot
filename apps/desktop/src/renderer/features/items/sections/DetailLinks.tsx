import { useState } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import type { ItemLink, LinkKindValue } from '@queuepilot/core/types';
import type { Item } from '@queuepilot/core/types';
import { Button } from '../../../components/ui/button';
import { useApi } from '../../../hooks/useApi';
import { useUiStore } from '../../../store/ui.store';

const KIND_LABELS: Record<LinkKindValue, string> = {
  blocks: 'Blocks',
  blocked_by: 'Blocked by',
  relates_to: 'Relates to',
  duplicate: 'Duplicate of',
};

const KIND_OPTIONS = Object.entries(KIND_LABELS) as [LinkKindValue, string][];

export function DetailLinks({ itemId, links }: { itemId: string; links: ItemLink[] }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const { setSelectedItemId } = useUiStore();
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<Item | null>(null);
  const [kind, setKind] = useState<LinkKindValue>('relates_to');

  const { data: searchResults } = useQuery({
    queryKey: ['items-search', search],
    queryFn: async () => {
      const res = await api.items.list(search ? { q: search } : undefined);
      return (res.data as Item[]).filter((i) => i.id !== itemId);
    },
    enabled: adding,
  });

  // Separate query to resolve titles for existing linked items
  const linkedItemIds = links.flatMap((l) => [l.source_item_id, l.target_item_id]).filter((id) => id !== itemId);
  const { data: linkedItems = [] } = useQuery({
    queryKey: ['items-linked', linkedItemIds],
    queryFn: async () => {
      if (linkedItemIds.length === 0) return [] as Item[];
      const res = await api.items.list();
      return (res.data as Item[]).filter((i) => linkedItemIds.includes(i.id));
    },
    enabled: linkedItemIds.length > 0,
  });

  const grouped = KIND_OPTIONS.map(([kindValue, label]) => ({
    kind: kindValue,
    label,
    links: links.filter((l) => l.kind === kindValue),
  })).filter((g) => g.links.length > 0);

  const linkedIds = new Set(links.flatMap((l) => [l.source_item_id, l.target_item_id]));

  function otherItemId(link: ItemLink): string {
    return link.source_item_id === itemId ? link.target_item_id : link.source_item_id;
  }

  function otherItemTitle(link: ItemLink): string {
    const oid = otherItemId(link);
    const found = linkedItems.find((i) => i.id === oid);
    return found?.title ?? oid;
  }

  async function addLink() {
    if (!selectedTarget) return;
    await api.items.links.create(itemId, { target_item_id: selectedTarget.id, kind, source_item_id: itemId });
    setAdding(false);
    setSearch('');
    setSelectedTarget(null);
    setKind('relates_to');
    queryClient.invalidateQueries({ queryKey: ['links', itemId] });
  }

  const filteredResults = (searchResults ?? []).filter((i) => !linkedIds.has(i.id));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Links</p>
        <button
          onClick={() => { setAdding((prev) => !prev); setSearch(''); setSelectedTarget(null); }}
          className="text-xs focus:outline-none transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          {adding ? '× Cancel' : '+ Add link'}
        </button>
      </div>

      {grouped.length > 0 && (
        <div className="space-y-2">
          {grouped.map(({ kind: k, label, links: groupLinks }) => (
            <div key={k}>
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
              <div className="space-y-0.5">
                {groupLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => setSelectedItemId(otherItemId(link))}
                    className="block w-full text-left text-xs rounded px-2 py-1 transition-colors truncate"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                  >
                    {otherItemTitle(link)}
                    <span className="ml-1" style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>#{otherItemId(link)}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <div className="space-y-2 rounded p-2" style={{ background: 'var(--bg-secondary)' }}>
          {selectedTarget ? (
            <div className="flex items-center justify-between rounded px-2 py-1" style={{ background: 'var(--bg-tertiary)' }}>
              <span className="text-xs truncate" style={{ color: 'var(--text-primary)' }}>{selectedTarget.title}</span>
              <button
                className="text-xs ml-2 shrink-0"
                style={{ color: 'var(--text-muted)' }}
                onClick={() => setSelectedTarget(null)}
              >×</button>
            </div>
          ) : (
            <div className="relative">
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items to link…"
                className="w-full rounded px-2 py-1 text-xs focus:outline-none"
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
              {filteredResults.length > 0 && (
                <div
                  className="absolute left-0 right-0 mt-1 rounded shadow-lg z-10 max-h-40 overflow-y-auto"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
                >
                  {filteredResults.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setSelectedTarget(item); setSearch(''); }}
                      className="block w-full text-left px-2 py-1.5 text-xs transition-colors truncate"
                      style={{ color: 'var(--text-primary)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as LinkKindValue)}
            className="w-full rounded px-2 py-1 text-xs focus:outline-none"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          >
            {KIND_OPTIONS.map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={addLink} disabled={!selectedTarget}>Add</Button>
            <Button variant="ghost" size="sm" onClick={() => { setAdding(false); setSearch(''); setSelectedTarget(null); }}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}
