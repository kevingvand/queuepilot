import { useState } from 'react';
import type { Cycle } from '@queuepilot/core/types';
import { ChevronDown, Pencil, Plus, RotateCcw, X, Zap, ZapOff } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useUiStore } from '../../store/ui.store';
import { CreateCycleDialog } from './CreateCycleDialog';
import { EditCycleDialog } from './EditCycleDialog';
import { useActivateCycle, useCycles, useDeactivateCycle, useDeleteCycle } from './hooks/useCycles';

type CycleStatus = 'planned' | 'active' | 'completed' | 'archived';

const STATUS_DOT_CLASSES: Record<CycleStatus, string> = {
  planned: 'bg-blue-400',
  active: 'bg-green-400',
  completed: 'bg-gray-400',
  archived: 'bg-gray-300',
};

type CycleRowProps = {
  cycle: Cycle;
  selected: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
};

function CycleRow({ cycle, selected, onClick, onEdit, onDelete, onActivate, onDeactivate }: CycleRowProps) {
  const status = (cycle.status ?? 'planned') as CycleStatus;
  const dotClass = STATUS_DOT_CLASSES[status] ?? STATUS_DOT_CLASSES.planned;
  const isActive = status === 'active';

  return (
    <div className="group relative">
      <button
        onClick={onClick}
        className={cn(
          'w-full flex items-start gap-2 px-4 py-1.5 pr-20 text-sm text-left transition-colors',
          selected
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
        )}
      >
        <span className={cn('mt-1.5 w-2 h-2 rounded-full flex-shrink-0', dotClass)} />
        <div className="flex flex-col min-w-0">
          <span className="truncate text-sm font-medium leading-snug">{cycle.name}</span>
          {cycle.goal && (
            <span className="truncate text-xs text-muted-foreground leading-snug mt-0.5">
              {cycle.goal}
            </span>
          )}
        </div>
      </button>

      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isActive ? (
          <button
            onClick={(e) => { e.stopPropagation(); onDeactivate(); }}
            className="text-green-400 hover:text-muted-foreground transition-colors"
            title="Deactivate cycle"
          >
            <ZapOff size={11} />
          </button>
        ) : (status === 'planned') ? (
          <button
            onClick={(e) => { e.stopPropagation(); onActivate(); }}
            className="text-muted-foreground hover:text-yellow-400 transition-colors"
            title="Activate cycle"
          >
            <Zap size={11} />
          </button>
        ) : null}
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Edit cycle"
        >
          <Pencil size={11} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
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
  const { activeCycleId, setActiveCycleId } = useUiStore();
  const { data: cycles, isLoading } = useCycles();
  const { mutate: deleteCycle } = useDeleteCycle();
  const { mutate: activateCycle } = useActivateCycle();
  const { mutate: deactivateCycle } = useDeactivateCycle();

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
            selected={activeCycleId === cycle.id}
            onClick={() => setActiveCycleId(cycle.id)}
            onEdit={() => setEditCycle(cycle)}
            onDelete={() => deleteCycle(cycle.id)}
            onActivate={() => activateCycle(cycle.id)}
            onDeactivate={() => deactivateCycle(cycle.id)}
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
                  selected={activeCycleId === cycle.id}
                  onClick={() => setActiveCycleId(cycle.id)}
                  onEdit={() => setEditCycle(cycle)}
                  onDelete={() => deleteCycle(cycle.id)}
                  onActivate={() => activateCycle(cycle.id)}
                  onDeactivate={() => deactivateCycle(cycle.id)}
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
