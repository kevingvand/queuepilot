import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Item } from '@queuepilot/core/types';
import { useApi } from '../../../hooks/useApi';

export function DetailSubtasks({ itemId }: { itemId: string }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState('');

  const { data: subtasks = [] } = useQuery({
    queryKey: ['subtasks', itemId],
    queryFn: async () => (await api.items.list({ parent_id: itemId })).data as Item[],
  });

  const done = subtasks.filter((s) => s.status === 'done').length;
  const total = subtasks.length;
  const pct = total > 0 ? (done / total) * 100 : 0;

  async function toggleDone(subtask: Item) {
    const next = subtask.status === 'done' ? 'inbox' : 'done';
    await api.items.update(subtask.id, { status: next });
    queryClient.invalidateQueries({ queryKey: ['subtasks', itemId] });
  }

  async function addSubtask() {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    setNewTitle('');
    await api.items.create({ title: trimmed, parent_id: itemId, status: 'inbox' });
    queryClient.invalidateQueries({ queryKey: ['subtasks', itemId] });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Subtasks</p>
        {total > 0 && (
          <span className="text-xs text-muted-foreground">{done}/{total}</span>
        )}
      </div>
      {total > 0 && (
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
      <div className="space-y-1">
        {subtasks.map((subtask) => (
          <label key={subtask.id} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={subtask.status === 'done'}
              onChange={() => toggleDone(subtask)}
              className="rounded border-border focus:ring-1 focus:ring-primary"
            />
            <span
              className={`text-sm ${subtask.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}
            >
              {subtask.title}
            </span>
          </label>
        ))}
      </div>
      <input
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
        placeholder="Add subtask…"
        className="w-full bg-muted border border-border rounded px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}
