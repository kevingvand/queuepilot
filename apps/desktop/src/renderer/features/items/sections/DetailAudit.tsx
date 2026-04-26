import type { ItemEvent } from '@queuepilot/core/types';
import { formatRelative } from '../../../lib/utils';

const PRIORITY_LABELS: Record<number, string> = {
  0: 'none',
  1: 'low',
  2: 'medium',
  3: 'high',
  4: 'urgent',
};

const FIELD_DISPLAY_NAMES: Record<string, string> = {
  due_at: 'Due date',
  scheduled_at: 'Scheduled',
  start_at: 'Start date',
  cycle_id: 'Cycle',
  body: 'Description',
  title: 'Title',
  priority: 'Priority',
  status: 'Status',
};

function humanize(str: string): string {
  return str.replace(/_/g, ' ');
}

function formatFieldValue(field: string, value: string): string {
  if ((field === 'due_at' || field === 'scheduled_at' || field === 'start_at') && /^\d+$/.test(value)) {
    return new Date(Number(value)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  if (field === 'priority') return PRIORITY_LABELS[Number(value)] ?? value;
  return humanize(value);
}

interface DetailAuditProps {
  itemId: string;
  events: ItemEvent[];
  isLoading: boolean;
}

function describeEvent(event: ItemEvent): React.ReactNode {
  let payload: Record<string, unknown> = {};
  if (event.payload) {
    try {
      payload = JSON.parse(event.payload) as Record<string, unknown>;
    } catch {
      // malformed payload — treat as empty rather than crashing the audit log
    }
  }

  switch (event.kind) {
    case 'created':
      return 'Item created';
    case 'status_changed':
      return (
        <>
          Status changed from <strong>{humanize(String(payload.from))}</strong> to{' '}
          <strong>{humanize(String(payload.to))}</strong>
        </>
      );
    case 'priority_changed':
      return (
        <>
          Priority changed from{' '}
          <strong>{PRIORITY_LABELS[Number(payload.from)] ?? String(payload.from)}</strong> to{' '}
          <strong>{PRIORITY_LABELS[Number(payload.to)] ?? String(payload.to)}</strong>
        </>
      );
    case 'title_changed':
      return 'Title updated';
    case 'comment_added':
      return 'Comment added';
    case 'field_changed': {
      const field = String(payload.field ?? '');
      const displayName = FIELD_DISPLAY_NAMES[field] ?? humanize(field);
      const to = payload.to != null ? String(payload.to) : '';
      const displayTo = to ? formatFieldValue(field, to) : '';
      return displayTo
        ? <><strong>{displayName}</strong> set to <strong>{displayTo}</strong></>
        : <><strong>{displayName}</strong> cleared</>;
    }
    case 'tag_added':
      return (
        <>
          Tag <strong>{String(payload.tag_name)}</strong> added
        </>
      );
    case 'tag_removed':
      return (
        <>
          Tag <strong>{String(payload.tag_name)}</strong> removed
        </>
      );
    case 'link_added':
      return (
        <>
          Linked as <strong>{String(payload.kind)}</strong> to another item
        </>
      );
    case 'cycle_assigned':
      return (
        <>
          Added to cycle <strong>{String(payload.cycle_name)}</strong>
        </>
      );
    default:
      return `Event: ${event.kind}`;
  }
}

function AuditSkeleton() {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Activity</p>
      <div className="space-y-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="flex items-center gap-3 pl-5">
            <div className="h-3.5 w-40 rounded animate-pulse" style={{ background: 'var(--bg-secondary)' }} />
            <div className="h-3 w-10 rounded animate-pulse ml-auto" style={{ background: 'var(--bg-secondary)' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetailAudit({ events, isLoading }: DetailAuditProps) {
  if (isLoading) {
    return <AuditSkeleton />;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Activity</p>
      {events.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No activity yet</p>
      ) : (
        <div className="relative ml-1">
          <div className="absolute left-[3px] top-1 bottom-1 w-px" style={{ background: 'var(--border)' }} />
          <div className="space-y-2.5">
            {events.map((event) => (
              <div key={event.id} className="relative flex items-start gap-3 pl-5">
                <div className="absolute left-0 top-[5px] w-[7px] h-[7px] rounded-full" style={{ background: 'var(--text-muted)', opacity: 0.4, border: '1px solid var(--text-muted)' }} />
                <div className="flex flex-1 items-start justify-between gap-2 min-w-0">
                  <p className="text-sm leading-snug" style={{ color: 'var(--text-secondary)' }}>{describeEvent(event)}</p>
                  <span className="text-xs shrink-0 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                    {formatRelative(event.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
