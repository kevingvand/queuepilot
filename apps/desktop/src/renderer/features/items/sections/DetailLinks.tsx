import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ItemLink, LinkKindValue } from '@queuepilot/core/types';
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
  const [targetId, setTargetId] = useState('');
  const [kind, setKind] = useState<LinkKindValue>('relates_to');

  const grouped = KIND_OPTIONS.map(([kindValue, label]) => ({
    kind: kindValue,
    label,
    links: links.filter((l) => l.kind === kindValue),
  })).filter((g) => g.links.length > 0);

  function otherItemId(link: ItemLink): string {
    return link.source_item_id === itemId ? link.target_item_id : link.source_item_id;
  }

  async function addLink() {
    if (!targetId.trim()) return;
    await api.items.links.create(itemId, { target_item_id: targetId.trim(), kind });
    setAdding(false);
    setTargetId('');
    setKind('relates_to');
    queryClient.invalidateQueries({ queryKey: ['links', itemId] });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Links</p>
        <button
          onClick={() => setAdding((prev) => !prev)}
          className="text-xs text-muted-foreground hover:text-foreground focus:outline-none"
        >
          + Add link
        </button>
      </div>
      {grouped.length > 0 && (
        <div className="space-y-2">
          {grouped.map(({ kind: k, label, links: groupLinks }) => (
            <div key={k}>
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <div className="space-y-0.5">
                {groupLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => setSelectedItemId(otherItemId(link))}
                    className="block w-full text-left text-xs text-foreground bg-muted rounded px-2 py-1 hover:bg-accent transition-colors truncate"
                  >
                    {otherItemId(link)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {adding && (
        <div className="space-y-2 bg-muted rounded p-2">
          <input
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            placeholder="Target item ID"
            className="w-full bg-background border border-border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as LinkKindValue)}
            className="w-full bg-background border border-border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {KIND_OPTIONS.map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={addLink}>Add</Button>
            <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}
