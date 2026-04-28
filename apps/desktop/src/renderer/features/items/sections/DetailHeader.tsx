import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Item } from '@queuepilot/core/types';
import type { BadgeProps } from '../../../components/ui/badge';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Tooltip } from '../../../components/ui/tooltip';
import { useToast } from '../../../components/ui/toast';
import { useApi } from '../../../hooks/useApi';
import { useUiStore } from '../../../store/ui.store';

const STATUS_CYCLE = ['inbox', 'todo', 'in_progress', 'review', 'done', 'discarded'] as const;
type ItemStatus = (typeof STATUS_CYCLE)[number];

const PRIORITY_COLORS = ['bg-muted', 'bg-blue-400', 'bg-yellow-400', 'bg-orange-400', 'bg-red-500'];
const PRIORITY_LABELS = ['None', 'Low', 'Medium', 'High', 'Urgent'];

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

function cycleStatus(current: string): ItemStatus {
  const index = STATUS_CYCLE.indexOf(current as ItemStatus);
  if (index === -1) return 'inbox';
  return STATUS_CYCLE[(index + 1) % STATUS_CYCLE.length];
}

export function DetailHeader({ item }: { item: Item }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { setSelectedItemId, focusDetailTitle, clearFocusDetailTitle } = useUiStore();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const { data: parent } = useQuery<Item>({
    queryKey: ['item', item.parent_id],
    queryFn: async () => (await api.items.get(item.parent_id!)).data as Item,
    enabled: !!item.parent_id,
  });

  useEffect(() => {
    setEditing(false);
    setTitle(item.title);
  }, [item.id]);

  useEffect(() => {
    if (!focusDetailTitle) return;
    clearFocusDetailTitle();
    setEditing(true);
  }, [focusDetailTitle, clearFocusDetailTitle]);

  useEffect(() => {
    if (editing) titleInputRef.current?.focus();
  }, [editing]);

  async function saveTitle() {
    setEditing(false);
    if (title === item.title) return;
    try {
      await api.items.update(item.id, { title });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['items'] }),
        queryClient.invalidateQueries({ queryKey: ['item', item.id] }),
        queryClient.invalidateQueries({ queryKey: ['events', item.id] }),
      ]);
    } catch {
      setTitle(item.title);
      toast({ message: 'Failed to save title', variant: 'destructive' });
    }
  }

  async function advanceStatus() {
    const next = cycleStatus(item.status);
    try {
      await api.items.update(item.id, { status: next });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['items'] }),
        queryClient.invalidateQueries({ queryKey: ['item', item.id] }),
        queryClient.invalidateQueries({ queryKey: ['events', item.id] }),
      ]);
    } catch {
      toast({ message: 'Failed to update status', variant: 'destructive' });
    }
  }

  async function setPriority(priority: number) {
    try {
      await api.items.update(item.id, { priority });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['items'] }),
        queryClient.invalidateQueries({ queryKey: ['item', item.id] }),
        queryClient.invalidateQueries({ queryKey: ['events', item.id] }),
      ]);
    } catch {
      toast({ message: 'Failed to update priority', variant: 'destructive' });
    }
  }

  function discard() {
    setSelectedItemId(null);
    let cancelled = false;
    toast({
      message: `"${item.title}" deleted`,
      variant: 'destructive',
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => {
          cancelled = true;
          // Re-select the item — it hasn't been deleted yet
          setSelectedItemId(item.id);
        },
      },
    });
    setTimeout(async () => {
      if (cancelled) return;
      try {
        await api.items.delete(item.id);
        await queryClient.invalidateQueries({ queryKey: ['items'] });
      } catch {
        // Deletion failed — restore the item in the UI
        setSelectedItemId(item.id);
        toast({ message: `Failed to delete "${item.title}"`, variant: 'destructive' });
      }
    }, 5000);
  }

  function copyBranch() {
    const branch = `feature/QP-${item.id.slice(-8)}-${slugify(item.title)}`;
    navigator.clipboard.writeText(branch);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 mb-0.5">
        <Tooltip content="Copy item ID">
          <button
            onClick={() => navigator.clipboard.writeText(`QP-${item.id}`)}
            className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
          >
            QP-{item.id}
          </button>
        </Tooltip>
      </div>
      {parent && (
        <button
          onClick={() => setSelectedItemId(parent.id)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors -mt-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          {parent.title}
        </button>
      )}
      <div className="flex items-start justify-between gap-2">
        {editing ? (
          <input
            ref={titleInputRef}
            className="flex-1 bg-transparent text-base font-semibold text-foreground focus:outline-none border-b border-primary"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setEditing(false); setTitle(item.title); } }}
          />
        ) : (
          <h2
            className="flex-1 text-base font-semibold text-foreground leading-snug cursor-text rounded px-0.5 -mx-0.5 hover:bg-muted/50 transition-colors"
            onClick={() => setEditing(true)}
            title="Click to edit title"
          >
            {item.title}
          </h2>
        )}
        <div className="flex items-center gap-1 shrink-0">
          <Tooltip content="Copy branch name">
            <Button variant="ghost" size="icon" onClick={copyBranch} className="h-7 w-7">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="18" r="3" />
                <circle cx="6" cy="6" r="3" />
                <circle cx="6" cy="18" r="3" />
                <line x1="6" y1="9" x2="6" y2="15" />
                <line x1="9" y1="6" x2="15" y2="6" />
              </svg>
            </Button>
          </Tooltip>
          <Tooltip content="Discard item">
            <Button variant="ghost" size="icon" onClick={discard} className="h-7 w-7 text-red-400 hover:text-red-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </Button>
          </Tooltip>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Tooltip content="Click to advance status">
          <button onClick={advanceStatus} className="focus:outline-none">
            <Badge status={item.status as BadgeProps['status']}>
              {item.status.replace(/_/g, ' ')}
            </Badge>
          </button>
        </Tooltip>
        <div className="flex items-center gap-1">
          {PRIORITY_COLORS.map((color, i) => (
            <Tooltip key={i} content={PRIORITY_LABELS[i]}>
              <button
                onClick={() => setPriority(i)}
                aria-label={`Set priority: ${PRIORITY_LABELS[i]}`}
                className={`w-3 h-3 rounded-full transition-opacity focus:outline-none ${color} ${
                  (item.priority ?? 0) === i
                    ? 'opacity-100 ring-1 ring-offset-1 ring-border'
                    : 'opacity-40 hover:opacity-70'
                }`}
              />
            </Tooltip>
          ))}
        </div>
      </div>
    </div>
  );
}
