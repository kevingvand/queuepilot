import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Tag } from '@queuepilot/core/types';
import { useApi } from '../../../hooks/useApi';

const TAG_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

export function DetailTags({ itemId }: { itemId: string }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'idle' | 'pick' | 'create'>('idle');
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(TAG_COLORS[0]);
  const inputRef = useRef<HTMLInputElement>(null);

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
    setMode('idle');
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['itemTags', itemId] }),
      queryClient.invalidateQueries({ queryKey: ['items'] }),
      queryClient.invalidateQueries({ queryKey: ['item', itemId] }),
    ]);
  }

  async function createAndAddTag() {
    const name = newName.trim();
    if (!name) return;
    const result = await api.tags.create({ name, color: newColor });
    const tag = (result as any).data as Tag;
    await queryClient.invalidateQueries({ queryKey: ['tags'] });
    await addTag(tag.id);
    setNewName('');
    setNewColor(TAG_COLORS[0]);
  }

  const availableTags = allTags.filter((t) => !itemTags.some((it) => it.id === t.id));

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Tags</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {itemTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium border"
            style={{
              backgroundColor: `${tag.color}18`,
              borderColor: `${tag.color}44`,
              color: 'var(--text-primary)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
            {tag.name}
            <button
              onClick={() => removeTag(tag.id)}
              className="hover:opacity-70 focus:outline-none leading-none ml-0.5"
              style={{ color: 'var(--text-muted)' }}
            >
              ×
            </button>
          </span>
        ))}

        {mode === 'pick' && availableTags.length > 0 && (
          <select
            autoFocus
            className="text-xs bg-muted border border-border rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value === '__create__') { setMode('create'); return; }
              addTag(e.target.value);
            }}
            onBlur={() => setTimeout(() => setMode('idle'), 150)}
          >
            <option value="" disabled>Pick a tag…</option>
            {availableTags.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
            <option value="__create__">+ Create new tag…</option>
          </select>
        )}

        {mode === 'pick' && availableTags.length === 0 && (
          <button
            autoFocus
            onClick={() => setMode('create')}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors italic"
          >
            + Create new tag
          </button>
        )}

        {mode === 'create' && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <input
              ref={inputRef}
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') createAndAddTag();
                if (e.key === 'Escape') setMode('idle');
              }}
              placeholder="Tag name…"
              className="text-xs bg-muted border border-border rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary w-24"
            />
            <div className="flex items-center gap-0.5">
              {TAG_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  aria-label={`Tag color ${c}`}
                  aria-pressed={newColor === c}
                  className="w-4 h-4 rounded-full transition-all"
                  style={{
                    backgroundColor: c,
                    outline: newColor === c ? `2px solid ${c}` : 'none',
                    outlineOffset: '1px',
                  }}
                />
              ))}
            </div>
            <button
              onClick={createAndAddTag}
              disabled={!newName.trim()}
              className="text-xs px-1.5 py-0.5 rounded bg-primary text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              Add
            </button>
            <button
              onClick={() => setMode('idle')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        {mode === 'idle' && (
          <button
            onClick={() => setMode(availableTags.length > 0 ? 'pick' : 'create')}
            className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-muted-foreground hover:text-foreground hover:bg-accent text-xs focus:outline-none"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}
