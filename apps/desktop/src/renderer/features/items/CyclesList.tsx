import { useState } from 'react';
import type { Cycle } from '@queuepilot/core/types';
import { ChevronDown, Pencil, Plus, RotateCcw, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useUiStore } from '../../store/ui.store';
import { CreateCycleDialog } from './CreateCycleDialog';
import { EditCycleDialog } from './EditCycleDialog';
import { useCycles, useDeleteCycle } from './hooks/useCycles';

type CycleStatus = 'planned' | 'active' | 'completed' | 'archived';

const STATUS_BADGE_CLASSES: Record<CycleStatus, string> = {
  planned: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
  active: 'bg-green-500/20 text-green-800 dark:text-green-300',
  completed: 'bg-gray-500/20 text-gray-600 dark:text-gray-400',
  archived: 'bg-muted text-muted-foreground',
};

function formatDateRange(startsAt: number | null, endsAt: number | null): string {
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
  const parts: string[] = [];
  if (startsAt) parts.push(formatter.format(new Date(startsAt)));
  if (endsAt) parts.push(formatter.format(new Date(endsAt)));
  return parts.join(' – ');
}

type CycleRowProps = {
  cycle: Cycle;
  active: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function CycleRow({ cycle, active, onClick, onEdit, onDelete }: CycleRowProps) {
  const statusClass =
    STATUS_BADGE_CLASSES[(cycle.status as CycleStatus) ?? 'planned'] ??
    STATUS_BADGE_CLASSES.planned;

  const dateRange = formatDateRange(cycle.starts_at, cycle.ends_at);

  return (
    <div className="group relative">
      <button
        onClick={onClick}
        className={cn(
          'w-full flex items-center gap-2 px-4 py-1.5 pr-16 text-sm text-left transition-colors',
          active
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
        )}
      >
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="truncate text-sm">{cycle.name}</span>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium flex-shrink-0',
                statusClass,
              )}
            >
              {cycle.status}
            </span>
          </div>
          {dateRange && (
            <span className="text-xs text-muted-foreground truncate">{dateRange}</span>
          )}
        </div>
      </button>

      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Edit cycle"
        >
          <Pencil size={11} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Delete cycle"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <>
      {[0, 1].map((index) => (
        <div key={index} className="mx-4 my-1 h-8 rounded bg-muted animate-pulse" />
      ))}
    </>
  );
}

export function CyclesList() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editCycle, setEditCycle] = useState<Cycle | null>(null);
  const [completedExpanded, setCompletedExpanded] = useState(false);
  const { filterState, setFilterState } = useUiStore();
  const { data: cycles, isLoading } = useCycles();
  const { mutate: deleteCycle } = useDeleteCycle();

  const activeCycles = cycles?.filter((c) => c.status === 'active' || c.status === 'planned') ?? [];
  const completedCycles =
    cycles?.filter((c) => c.status === 'completed' || c.status === 'archived') ?? [];

  return (
    <>
      <div className="mb-1">
        <div className="flex items-center gap-1 px-4 py-1">
          <RotateCcw size={12} />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Cycles
          </span>
          <button
            onClick={() => setCreateOpen(true)}
            className="ml-auto text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="New cycle"
          >
            <Plus size={12} />
          </button>
        </div>

        {isLoading && <LoadingSkeleton />}

        {!isLoading && (!cycles || cycles.length === 0) && (
          <p className="px-4 py-1.5 text-xs text-muted-foreground">No cycles yet</p>
        )}

        {activeCycles.map((cycle) => (
          <CycleRow
            key={cycle.id}
            cycle={cycle}
            active={filterState.cycle_id === cycle.id}
            onClick={() => setFilterState({ cycle_id: cycle.id })}
            onEdit={() => setEditCycle(cycle)}
            onDelete={() => deleteCycle(cycle.id)}
          />
        ))}

        {completedCycles.length > 0 && (
          <>
            <button
              onClick={() => setCompletedExpanded((prev) => !prev)}
              className="w-full flex items-center gap-1.5 px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown
                size={12}
                className={cn(
                  'flex-shrink-0 transition-transform',
                  completedExpanded ? 'rotate-0' : '-rotate-90',
                )}
              />
              <span>
                {completedExpanded ? 'Completed' : `Completed (${completedCycles.length})`}
              </span>
            </button>
            {completedExpanded &&
              completedCycles.map((cycle) => (
                <CycleRow
                  key={cycle.id}
                  cycle={cycle}
                  active={filterState.cycle_id === cycle.id}
                  onClick={() => setFilterState({ cycle_id: cycle.id })}
                  onEdit={() => setEditCycle(cycle)}
                  onDelete={() => deleteCycle(cycle.id)}
                />
              ))}
          </>
        )}
      </div>

      <CreateCycleDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditCycleDialog cycle={editCycle} onClose={() => setEditCycle(null)} />
    </>
  );
}
