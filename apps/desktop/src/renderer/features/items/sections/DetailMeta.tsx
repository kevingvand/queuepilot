import { useState } from 'react';
import type { Item } from '@queuepilot/core/types';
import { cn } from '../../../lib/utils';

function formatDate(ts: number | null | undefined): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function DetailMeta({ item }: { item: Item }) {
  const [open, setOpen] = useState(true);

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
          <dt className="text-muted-foreground">Due</dt>
          <dd className="text-foreground">{formatDate(item.due_at)}</dd>
          <dt className="text-muted-foreground">Scheduled</dt>
          <dd className="text-foreground">{formatDate(item.scheduled_at)}</dd>
          <dt className="text-muted-foreground">Start</dt>
          <dd className="text-foreground">{formatDate(item.start_at)}</dd>
          <dt className="text-muted-foreground">Created</dt>
          <dd className="text-foreground">{formatDate(item.created_at)}</dd>
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
