import type { ItemEvent } from '@queuepilot/core/types';
import { formatRelative } from '../../../lib/utils';

const PRIORITY_LABELS: Record<number, string> = {
  0: 'none',
  1: 'urgent',
  2: 'high',
  3: 'medium',
  4: 'low',
};

interface DetailAuditProps {
  itemId: string;
  events: ItemEvent[];
  isLoading: boolean;
}

function describeEvent(event: ItemEvent): React.ReactNode {
  const payload = event.payload
    ? (JSON.parse(event.payload) as Record<string, unknown>)
    : {};

  switch (event.kind) {
    case 'created':
      return 'Item created';
    case 'status_changed':
      return (
        <>
          Status changed from <strong>{String(payload.from)}</strong> to{' '}
          <strong>{String(payload.to)}</strong>
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
      <p className="text-xs font-medium text-muted-foreground">Activity</p>
      <div className="space-y-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="flex items-center gap-3 pl-5">
            <div className="h-3.5 w-40 rounded bg-muted animate-pulse" />
            <div className="h-3 w-10 rounded bg-muted animate-pulse ml-auto" />
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
      <p className="text-xs font-medium text-muted-foreground">Activity</p>
      {events.length === 0 ? (
        <p className="text-xs text-muted-foreground">No activity yet</p>
      ) : (
        <div className="relative ml-1">
          <div className="absolute left-[3px] top-1 bottom-1 w-px bg-border" />
          <div className="space-y-2.5">
            {events.map((event) => (
              <div key={event.id} className="relative flex items-start gap-3 pl-5">
                <div className="absolute left-0 top-[5px] w-[7px] h-[7px] rounded-full bg-muted-foreground/30 border border-muted-foreground/40" />
                <div className="flex flex-1 items-start justify-between gap-2 min-w-0">
                  <p className="text-sm text-foreground/80 leading-snug">{describeEvent(event)}</p>
                  <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
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
