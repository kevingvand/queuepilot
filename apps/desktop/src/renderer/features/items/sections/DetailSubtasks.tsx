import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Item } from '@queuepilot/core/types';
import { useApi } from '../../../hooks/useApi';
import { useToast } from '../../../components/ui/toast';

function SubtaskRow({ subtask, onToggle, onDelete, onRename }: {
  subtask: Item;
  onToggle: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(subtask.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const isDone = subtask.status === 'done';

  useEffect(() => { setTitle(subtask.title); }, [subtask.title]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  function commitRename() {
    setEditing(false);
    const trimmed = title.trim();
    if (trimmed && trimmed !== subtask.title) onRename(trimmed);
    else setTitle(subtask.title);
  }

  return (
    <div className="flex items-center gap-2.5 group py-0.5">
      <button
        onClick={onToggle}
        aria-label={isDone ? 'Mark incomplete' : 'Mark done'}
        className={`w-[18px] h-[18px] rounded-full border-2 shrink-0 flex items-center justify-center transition-all focus:outline-none ${
          isDone
            ? 'bg-primary border-primary'
            : 'border-border hover:border-primary'
        }`}
      >
        {isDone && (
          <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1.5 5l2.5 2.5 4.5-4.5" />
          </svg>
        )}
      </button>

      {editing ? (
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); commitRename(); }
            if (e.key === 'Escape') { setEditing(false); setTitle(subtask.title); }
          }}
          className="flex-1 bg-transparent text-sm text-foreground focus:outline-none border-b border-primary pb-px min-w-0"
        />
      ) : (
        <span
          onClick={() => !isDone && setEditing(true)}
          className={`flex-1 text-sm min-w-0 truncate transition-colors select-none ${
            isDone
              ? 'line-through text-muted-foreground/50 cursor-default'
              : 'text-foreground cursor-text'
          }`}
        >
          {subtask.title}
        </span>
      )}

      <button
        onClick={onDelete}
        aria-label="Delete subtask"
        className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity text-muted-foreground hover:text-danger focus:outline-none shrink-0"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function DetailSubtasks({ item }: { item: Item }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newTitle, setNewTitle] = useState('');
  const addInputRef = useRef<HTMLInputElement>(null);

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
    try {
      await api.items.update(subtask.id, { status: subtask.status === 'done' ? 'todo' : 'done' });
      queryClient.invalidateQueries({ queryKey: ['subtasks', item.id] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
    } catch {
      toast({ message: 'Failed to update subtask', variant: 'destructive' });
    }
  }

  async function renameSubtask(subtask: Item, title: string) {
    try {
      await api.items.update(subtask.id, { title });
      queryClient.invalidateQueries({ queryKey: ['subtasks', item.id] });
    } catch {
      toast({ message: 'Failed to rename subtask', variant: 'destructive' });
    }
  }

  async function deleteSubtask(subtask: Item) {
    try {
      await api.items.delete(subtask.id);
      queryClient.invalidateQueries({ queryKey: ['subtasks', item.id] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
    } catch {
      toast({ message: 'Failed to delete subtask', variant: 'destructive' });
    }
  }

  async function addSubtask() {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    setNewTitle('');
    try {
      await api.items.create({ title: trimmed, parent_id: item.id, status: 'inbox' });
      queryClient.invalidateQueries({ queryKey: ['subtasks', item.id] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      addInputRef.current?.focus();
    } catch {
      toast({ message: 'Failed to add subtask', variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subtasks</p>
        {total > 0 && (
          <span className="text-xs tabular-nums text-muted-foreground">{done}/{total}</span>
        )}
      </div>

      {total > 0 && (
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      <div className="space-y-0.5">
        {subtasks.map((subtask) => (
          <SubtaskRow
            key={subtask.id}
            subtask={subtask}
            onToggle={() => toggleDone(subtask)}
            onDelete={() => deleteSubtask(subtask)}
            onRename={(title) => renameSubtask(subtask, title)}
          />
        ))}
      </div>

      {!item.parent_id && (
        <div className="flex items-center gap-2.5 mt-1">
          <div className="w-[18px] h-[18px] rounded-full border-2 border-dashed border-border/50 shrink-0" />
          <input
            ref={addInputRef}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addSubtask(); }}
            placeholder="Add subtask…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}
