import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Tag } from '@queuepilot/core/types';
import { useApi } from '../../../hooks/useApi';

export function DetailTags({ itemId }: { itemId: string }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);

  const { data: itemTags = [] } = useQuery({
    queryKey: ['itemTags', itemId],
    queryFn: async () => (await api.items.tags.list(itemId)).data as Tag[],
  });

  const { data: allTags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => (await api.tags.list()).data as Tag[],
  });

  async function removeTag(tagId: string) {
    await api.items.tags.remove(itemId, tagId);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['itemTags', itemId] }),
      queryClient.invalidateQueries({ queryKey: ['items'] }),
      queryClient.invalidateQueries({ queryKey: ['item', itemId] }),
    ]);
  }

  async function addTag(tagId: string) {
    if (!tagId) return;
    await api.items.tags.add(itemId, tagId);
    setAdding(false);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['itemTags', itemId] }),
      queryClient.invalidateQueries({ queryKey: ['items'] }),
      queryClient.invalidateQueries({ queryKey: ['item', itemId] }),
    ]);
  }

  const availableTags = allTags.filter((t) => !itemTags.some((it) => it.id === t.id));

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Tags</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {itemTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ backgroundColor: `${tag.color}33`, color: tag.color }}
          >
            {tag.name}
            <button
              onClick={() => removeTag(tag.id)}
              className="hover:opacity-70 focus:outline-none leading-none"
            >
              ×
            </button>
          </span>
        ))}
        {adding ? (
          <select
            autoFocus
            className="text-xs bg-muted border border-border rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
            defaultValue=""
            onChange={(e) => addTag(e.target.value)}
            onBlur={() => setAdding(false)}
          >
            <option value="" disabled>Pick a tag…</option>
            {availableTags.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-muted-foreground hover:text-foreground hover:bg-accent text-xs focus:outline-none"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}
