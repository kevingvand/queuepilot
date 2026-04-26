import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { Cycle, Tag } from '@queuepilot/core/types';
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

const DEFAULT_FORM: FormState = {
  title: '',
  body: '',
  priority: '0',
  status: 'inbox',
  dueDate: '',
  cycleId: '',
  selectedTagIds: [],
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

type AddItemDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function AddItemDialog({ open, onClose }: AddItemDialogProps) {
  const api = useApi();
  const queryClient = useQueryClient();
  const { setSelectedItemId } = useUiStore();

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const res = await api.tags.list();
      return res.data as Tag[];
    },
  });

  const { data: cyclesData } = useQuery({
    queryKey: ['cycles'],
    queryFn: async () => {
      const res = await api.cycles.list();
      return res.data as Cycle[];
    },
  });

  function handleClose() {
    setForm(DEFAULT_FORM);
    setError(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        title: form.title.trim(),
        body: form.body,
        priority: Number(form.priority),
        status: form.status,
      };

      if (form.dueDate) {
        body.due_at = new Date(form.dueDate).getTime();
      }
      if (form.cycleId) {
        body.cycle_id = form.cycleId;
      }

      const createRes = await api.items.create(body);
      const created = createRes.data as { id: string };

      for (const tagId of form.selectedTagIds) {
        await api.items.tags.add(created.id, tagId);
      }

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

  return (
    <Dialog open={open} onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>New Item</DialogTitle>
        </DialogHeader>

        <DialogContent>
          <div className="space-y-3">
            <Input
              autoFocus
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              required
            />

            <Textarea
              placeholder="Description (optional)"
              rows={3}
              value={form.body}
              onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Priority</label>
                <Select
                  value={form.priority}
                  onChange={(value) => setForm((prev) => ({ ...prev, priority: value }))}
                >
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">Status</label>
                <Select
                  value={form.status}
                  onChange={(value) => setForm((prev) => ({ ...prev, status: value }))}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Due date</label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">Cycle</label>
                <Select
                  value={form.cycleId}
                  onChange={(value) => setForm((prev) => ({ ...prev, cycleId: value }))}
                >
                  <option value="">No cycle</option>
                  {cyclesData?.map((cycle) => (
                    <option key={cycle.id} value={cycle.id}>
                      {cycle.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {tagsData && tagsData.length > 0 && (
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {tagsData.map((tag) => {
                    const selected = form.selectedTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium transition-colors',
                          selected
                            ? 'bg-primary/20 text-primary border border-primary/40'
                            : 'bg-muted text-muted-foreground border border-border hover:border-primary/40',
                        )}
                      >
                        <span
                          className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tag.color ?? '#888' }}
                        />
                        {tag.name}
                        {selected && <span>×</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>
        </DialogContent>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || !form.title.trim()}>
            {submitting ? 'Creating…' : 'Create'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
