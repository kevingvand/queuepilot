import { useEffect, useRef, useState } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import type { Cycle, Tag } from '@queuepilot/core/types';
import { ChevronDown } from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { useApi } from '../../hooks/useApi';
import { cn } from '../../lib/utils';
import { useUiStore } from '../../store/ui.store';

type FormState = {
  title: string;
  body: string;
  priority: string;
  status: string;
  dueDate: string;
  cycleId: string;
  selectedTagIds: string[];
};

const PRIORITY_OPTIONS = [
  { label: 'None', value: '0' },
  { label: 'Low', value: '1' },
  { label: 'Medium', value: '2' },
  { label: 'High', value: '3' },
  { label: 'Urgent', value: '4' },
];

const STATUS_OPTIONS = [
  { label: 'Inbox', value: 'inbox' },
  { label: 'Todo', value: 'todo' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Done', value: 'done' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Discarded', value: 'discarded' },
];

function dateInputToTs(val: string): number | null {
  if (!val) return null;
  return new Date(val + 'T00:00:00').getTime();
}

type AddItemDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function AddItemDialog({ open, onClose }: AddItemDialogProps) {
  const api = useApi();
  const queryClient = useQueryClient();
  const { setSelectedItemId } = useUiStore();

  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const [form, setForm] = useState<FormState>({
    title: '',
    body: '',
    priority: '0',
    status: 'inbox',
    dueDate: '',
    cycleId: '',
    selectedTagIds: [],
  });
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => (await api.tags.list()).data as Tag[],
  });

  const { data: cyclesData } = useQuery({
    queryKey: ['cycles'],
    queryFn: async () => (await api.cycles.list()).data as Cycle[],
  });

  // Reset form on open
  useEffect(() => {
    if (!open) return;
    setForm({ title: '', body: '', priority: '0', status: 'inbox', dueDate: '', cycleId: '', selectedTagIds: [] });
    setExpanded(false);
    setError(null);
  }, [open]);

  // Focus body textarea when expanding
  useEffect(() => {
    if (expanded && bodyRef.current) {
      bodyRef.current.focus();
    }
  }, [expanded]);

  function handleClose() {
    setError(null);
    onClose();
  }

  function handleTitleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Tab' && !e.shiftKey && !expanded) {
      e.preventDefault();
      setExpanded(true);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        body: form.body,
        priority: Number(form.priority),
        status: form.status,
      };

      const dueTs = dateInputToTs(form.dueDate);
      if (dueTs !== null) payload.due_at = dueTs;
      if (form.cycleId) payload.cycle_id = form.cycleId;

      const createRes = await api.items.create(payload);
      const created = createRes.data as { id: string };
      await Promise.all(form.selectedTagIds.map((id) => api.items.tags.add(created.id, id)));
      await queryClient.invalidateQueries({ queryKey: ['items'] });
      setSelectedItemId(created.id);

      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item');
    } finally {
      setSubmitting(false);
    }
  }

  function toggleTag(tagId: string) {
    setForm((prev) => ({
      ...prev,
      selectedTagIds: prev.selectedTagIds.includes(tagId)
        ? prev.selectedTagIds.filter((id) => id !== tagId)
        : [...prev.selectedTagIds, tagId],
    }));
  }

  const labelStyle = { color: 'var(--text-muted)', fontSize: '11px', fontWeight: 500 };

  return (
    <Dialog open={open} onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>New item</DialogTitle>
        </DialogHeader>

        <DialogContent>
          <div className="space-y-3">
            <Input
              autoFocus
              placeholder="What's on your mind? (Enter to save)"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              onKeyDown={handleTitleKeyDown}
              required
            />

            {/* Expand trigger — visible when collapsed */}
            {!expanded && (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="flex items-center gap-1 text-xs transition-colors focus:outline-none focus-visible:underline"
                style={{ color: 'var(--text-muted)' }}
                tabIndex={0}
                aria-label="Add details"
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)')}
              >
                <ChevronDown size={12} />
                Add details <span style={{ color: 'var(--text-muted)', opacity: 0.6 }}>(Tab)</span>
              </button>
            )}

            {/* Details form — hidden in DOM when collapsed to preserve focus management */}
            <div style={{ display: expanded ? 'contents' : 'none' }}>
              <Textarea
                ref={bodyRef}
                placeholder="Description (optional)"
                rows={3}
                value={form.body}
                onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1" style={labelStyle}>Priority</label>
                  <Select
                    value={form.priority}
                    onChange={(value) => setForm((prev) => ({ ...prev, priority: value }))}
                  >
                    {PRIORITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block mb-1" style={labelStyle}>Status</label>
                  <Select
                    value={form.status}
                    onChange={(value) => setForm((prev) => ({ ...prev, status: value }))}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1" style={labelStyle}>Due date</label>
                  <Input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block mb-1" style={labelStyle}>Cycle</label>
                  <Select
                    value={form.cycleId}
                    onChange={(value) => setForm((prev) => ({ ...prev, cycleId: value }))}
                  >
                    <option value="">No cycle</option>
                    {cyclesData?.map((cycle) => (
                      <option key={cycle.id} value={cycle.id}>{cycle.name}</option>
                    ))}
                  </Select>
                </div>
              </div>

              {tagsData && tagsData.length > 0 && (
                <div>
                  <label className="block mb-1.5" style={labelStyle}>Tags</label>
                  <div className="flex flex-wrap gap-1.5">
                    {tagsData.map((tag) => {
                      const selected = form.selectedTagIds.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium transition-all border',
                          )}
                          style={
                            selected
                              ? { backgroundColor: `${tag.color ?? '#888'}18`, color: 'var(--text-primary)', borderColor: `${tag.color ?? '#888'}44` }
                              : { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)', borderColor: 'var(--border)' }
                          }
                        >
                          <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color ?? '#888' }} />
                          {tag.name}
                          {selected && <span>×</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {error && <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>}
          </div>
        </DialogContent>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || !form.title.trim()}>
            {submitting ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
