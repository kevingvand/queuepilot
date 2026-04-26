import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Cycle, Item } from '@queuepilot/core/types';
import { cn } from '../../../lib/utils';
import { useApi } from '../../../hooks/useApi';

function formatDate(ts: number | null | undefined): string | null {
  if (!ts) return null;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function tsToDateInput(ts: number | null | undefined): string {
  if (!ts) return '';
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dateInputToTs(val: string): number | null {
  if (!val) return null;
  return new Date(val + 'T00:00:00').getTime();
}

type EditableField = 'due_at' | 'scheduled_at' | 'start_at' | 'cycle_id';

interface DateFieldProps {
  field: 'due_at' | 'scheduled_at' | 'start_at';
  label: string;
  item: Item;
  editingField: EditableField | null;
  setEditingField: (f: EditableField | null) => void;
  onSave: (field: EditableField, value: number | null) => void;
}

function DateField({ field, label, item, editingField, setEditingField, onSave }: DateFieldProps) {
  const ts = item[field] as number | null | undefined;
  const isEditing = editingField === field;

  if (isEditing) {
    return (
      <>
        <dt className="text-muted-foreground self-center">{label}</dt>
        <dd>
          <input
            type="date"
            autoFocus
            autoComplete="off"
            data-lpignore="true"
            data-1p-ignore
            defaultValue={tsToDateInput(ts)}
            className="bg-transparent text-xs text-foreground border-b border-primary focus:outline-none w-full"
            onBlur={(e) => onSave(field, dateInputToTs(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              if (e.key === 'Escape') setEditingField(null);
            }}
          />
        </dd>
      </>
    );
  }

  return (
    <>
      <dt className="text-muted-foreground self-center">{label}</dt>
      <dd>
        {ts ? (
          <button
            onClick={() => setEditingField(field)}
            className="text-foreground hover:text-primary transition-colors text-left group flex items-center gap-1"
          >
            {formatDate(ts)}
            <svg className="opacity-0 group-hover:opacity-60 transition-opacity" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        ) : (
          <button
            onClick={() => setEditingField(field)}
            className="text-muted-foreground/50 hover:text-muted-foreground transition-colors text-xs italic"
          >
            + Set date
          </button>
        )}
      </dd>
    </>
  );
}

interface CycleFieldProps {
  item: Item;
  cycles: Cycle[];
  editingField: EditableField | null;
  setEditingField: (f: EditableField | null) => void;
  onSave: (field: EditableField, value: string | null) => void;
}

function CycleField({ item, cycles, editingField, setEditingField, onSave }: CycleFieldProps) {
  const isEditing = editingField === 'cycle_id';
  const currentCycle = cycles.find((c) => c.id === item.cycle_id);

  if (isEditing) {
    return (
      <>
        <dt className="text-muted-foreground self-center">Cycle</dt>
        <dd>
          <select
            autoFocus
            defaultValue={item.cycle_id ?? ''}
            className="bg-[var(--bg-secondary)] text-xs text-foreground border border-border rounded px-1 py-0.5 focus:outline-none focus:border-primary"
            onChange={(e) => onSave('cycle_id', e.target.value || null)}
            onBlur={() => setEditingField(null)}
          >
            <option value="">No cycle</option>
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </dd>
      </>
    );
  }

  return (
    <>
      <dt className="text-muted-foreground self-center">Cycle</dt>
      <dd>
        {currentCycle ? (
          <button
            onClick={() => setEditingField('cycle_id')}
            className="text-foreground hover:text-primary transition-colors text-left group flex items-center gap-1"
          >
            {currentCycle.name}
            <svg className="opacity-0 group-hover:opacity-60 transition-opacity" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        ) : (
          <button
            onClick={() => setEditingField('cycle_id')}
            className="text-muted-foreground/50 hover:text-muted-foreground transition-colors text-xs italic"
          >
            + Set cycle
          </button>
        )}
      </dd>
    </>
  );
}

export function DetailMeta({ item }: { item: Item }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingField, setEditingField] = useState<EditableField | null>(null);

  const { data: cycles = [] } = useQuery<Cycle[]>({
    queryKey: ['cycles'],
    queryFn: async () => (await api.cycles.list()).data as Cycle[],
  });

  async function saveField(field: EditableField, value: number | string | null) {
    setEditingField(null);
    await api.items.update(item.id, { [field]: value });
    queryClient.invalidateQueries({ queryKey: ['item', item.id] });
    queryClient.invalidateQueries({ queryKey: ['events', item.id] });
  }

  return (
    <div className="space-y-1">
      <button
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full text-left"
        onClick={() => setOpen((prev) => !prev)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn('transition-transform', open ? 'rotate-90' : '')}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        Metadata
      </button>
      {open && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mt-2">
          <DateField field="due_at" label="Due" item={item} editingField={editingField} setEditingField={setEditingField} onSave={saveField} />
          <DateField field="scheduled_at" label="Scheduled" item={item} editingField={editingField} setEditingField={setEditingField} onSave={saveField} />
          <DateField field="start_at" label="Start" item={item} editingField={editingField} setEditingField={setEditingField} onSave={saveField} />
          {item.created_at && (
            <>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="text-foreground">{formatDate(item.created_at)}</dd>
            </>
          )}
          <CycleField item={item} cycles={cycles} editingField={editingField} setEditingField={setEditingField} onSave={saveField} />
          {item.source_id && (
            <>
              <dt className="text-muted-foreground">Source</dt>
              <dd className="text-foreground">Via {item.source_id}</dd>
            </>
          )}
        </dl>
      )}
    </div>
  );
}
