import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Item } from '@queuepilot/core/types';
import { useApi } from '../../../hooks/useApi';
import { useUiStore } from '../../../store/ui.store';

function NavigateArrow() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="opacity-0 group-hover:opacity-50 transition-opacity shrink-0"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function SubtaskRow({ subtask, onToggle, onDelete, onRename, onNavigate }: {
  subtask: Item;
  onToggle: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
  onNavigate: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(subtask.title);

  function commit() {
    const trimmed = title.trim();
    if (trimmed && trimmed !== subtask.title) onRename(trimmed);
    else setTitle(subtask.title);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') { setTitle(subtask.title); setEditing(false); }
          }}
          className="flex-1 bg-transparent text-sm text-foreground border-b border-primary focus:outline-none"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      <input
        type="checkbox"
        checked={subtask.status === 'done'}
        onChange={onToggle}
        className="rounded border-border focus:ring-1 focus:ring-primary shrink-0"
      />
      <span
        className={`flex-1 text-sm cursor-pointer flex items-center gap-1 min-w-0 ${subtask.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}
        onClick={onNavigate}
        onDoubleClick={() => setEditing(true)}
        title="Click to view · Double-click to rename"
      >
        <span className="truncate">{subtask.title}</span>
        <NavigateArrow />
      </span>
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity text-muted-foreground hover:text-destructive focus:outline-none shrink-0"
        title="Delete subtask"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
        </svg>
      </button>
    </div>
  );
}

export function DetailSubtasks({ item }: { item: Item }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const { setSelectedItemId } = useUiStore();
  const [newTitle, setNewTitle] = useState('');

  const { data: subtasks = [] } = useQuery({
    queryKey: ['subtasks', item.id],
    queryFn: async () => {
      const res = await api.items.list({ parent_id: item.id });
      return (res.data as Item[]).filter((s) => s.status !== 'discarded');
    },
  });

  const done = subtasks.filter((s) => s.status === 'done').length;
  const total = subtasks.length;
  const pct = total > 0 ? (done / total) * 100 : 0;

  async function toggleDone(subtask: Item) {
    const next = subtask.status === 'done' ? 'todo' : 'done';
    await api.items.update(subtask.id, { status: next });
    queryClient.invalidateQueries({ queryKey: ['subtasks', item.id] });
    queryClient.invalidateQueries({ queryKey: ['items'] });
  }

  async function deleteSubtask(subtask: Item) {
    await api.items.delete(subtask.id);
    queryClient.invalidateQueries({ queryKey: ['subtasks', item.id] });
    queryClient.invalidateQueries({ queryKey: ['items'] });
  }

  async function renameSubtask(subtask: Item, title: string) {
    await api.items.update(subtask.id, { title });
    queryClient.invalidateQueries({ queryKey: ['subtasks', item.id] });
  }

  async function addSubtask() {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    setNewTitle('');
    await api.items.create({ title: trimmed, parent_id: item.id, status: 'inbox' });
    queryClient.invalidateQueries({ queryKey: ['subtasks', item.id] });
    queryClient.invalidateQueries({ queryKey: ['items'] });
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
          <SubtaskRow
            key={subtask.id}
            subtask={subtask}
            onToggle={() => toggleDone(subtask)}
            onDelete={() => deleteSubtask(subtask)}
            onRename={(title) => renameSubtask(subtask, title)}
            onNavigate={() => setSelectedItemId(subtask.id)}
          />
        ))}
      </div>
      {!item.parent_id && (
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
          placeholder="Add subtask…"
          className="w-full bg-muted border border-border rounded px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      )}
    </div>
  );
}
