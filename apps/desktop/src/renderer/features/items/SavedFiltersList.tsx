import { useState } from 'react';
import { Filter, Plus, X } from 'lucide-react';
import type { SavedFilter } from '@queuepilot/core/types';
import { cn } from '../../lib/utils';
import { type FilterState, useUiStore } from '../../store/ui.store';
import { SaveFilterDialog } from './SaveFilterDialog';
import { useDeleteSavedFilter, useSavedFilters } from './hooks/useSavedFilters';

function parseSavedFilterJson(filterJson: string): FilterState {
  try {
    return JSON.parse(filterJson) as FilterState;
  } catch {
    return {};
  }
}

function isSavedFilterActive(filterState: FilterState, filterJson: string): boolean {
  return JSON.stringify(filterState) === filterJson;
}

type FilterRowProps = {
  savedFilter: SavedFilter;
  active: boolean;
  onClick: () => void;
  onDelete: () => void;
};

function FilterRow({ savedFilter, active, onClick, onDelete }: FilterRowProps) {
  return (
    <div className="group relative">
      <button
        onClick={onClick}
        className={cn(
          'w-full flex items-center gap-2 px-4 py-1.5 pr-9 text-sm text-left transition-colors',
          active
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
        )}
      >
        <Filter size={14} className="flex-shrink-0" />
        <span className="truncate">{savedFilter.name}</span>
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
        title="Delete filter"
      >
        <X size={12} />
      </button>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <>
      {[0, 1].map((index) => (
        <div
          key={index}
          className="mx-4 my-1 h-5 rounded bg-muted animate-pulse"
        />
      ))}
    </>
  );
}

export function SavedFiltersList() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { filterState, setFilterState } = useUiStore();
  const { data: savedFilters, isLoading } = useSavedFilters();
  const { mutate: deleteFilter } = useDeleteSavedFilter();

  const hasActiveFilter = Object.values(filterState).some(
    (value) => value !== undefined && value !== '',
  );

  return (
    <>
      <div className="mb-1">
        <div className="flex items-center gap-1 px-4 py-1">
          <Filter size={12} />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Saved Filters
          </span>
          <button
            onClick={() => setDialogOpen(true)}
            disabled={!hasActiveFilter}
            title={hasActiveFilter ? 'Save current filter' : 'Apply a filter first to save it'}
            className={cn(
              'ml-auto transition-colors',
              hasActiveFilter
                ? 'text-muted-foreground hover:text-foreground cursor-pointer'
                : 'text-muted-foreground/30 cursor-not-allowed',
            )}
          >
            <Plus size={12} />
          </button>
        </div>

        {isLoading && <LoadingSkeleton />}

        {!isLoading && (!savedFilters || savedFilters.length === 0) && (
          <p className="px-4 py-1.5 text-xs text-muted-foreground">No saved filters yet</p>
        )}

        {savedFilters?.map((savedFilter) => {
          const parsed = parseSavedFilterJson(savedFilter.filter_json);
          return (
            <FilterRow
              key={savedFilter.id}
              savedFilter={savedFilter}
              active={isSavedFilterActive(filterState, savedFilter.filter_json)}
              onClick={() => setFilterState(parsed)}
              onDelete={() => deleteFilter(savedFilter.id)}
            />
          );
        })}
      </div>

      <SaveFilterDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  );
}
