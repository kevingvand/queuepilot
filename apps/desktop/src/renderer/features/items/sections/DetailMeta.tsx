import type { Item } from '@queuepilot/core/types';
import { cn } from '../../../lib/utils';
import { useState } from 'react';

function formatDate(ts: number | null | undefined): string | null {
  if (!ts) return null;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function DetailMeta({ item }: { item: Item }) {
  const [open, setOpen] = useState(true);

  const rows = [
    { label: 'Due', value: formatDate(item.due_at) },
    { label: 'Scheduled', value: formatDate(item.scheduled_at) },
    { label: 'Start', value: formatDate(item.start_at) },
    { label: 'Created', value: formatDate(item.created_at) },
    item.source_id ? { label: 'Source', value: `Via ${item.source_id}` } : null,
  ].filter((row): row is { label: string; value: string } => row !== null && row.value !== null);

  if (rows.length === 0) return null;

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
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs mt-2">
          {rows.map(({ label, value }) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
