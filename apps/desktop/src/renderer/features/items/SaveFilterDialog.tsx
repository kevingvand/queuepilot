import { useState } from 'react';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { type FilterState, useUiStore } from '../../store/ui.store';
import { useCreateSavedFilter } from './hooks/useSavedFilters';

type SaveFilterDialogProps = {
  open: boolean;
  onClose: () => void;
};

function buildFilterPreview(filterState: FilterState): string {
  const labelMap: Record<string, string> = {
    status: 'Status',
    tag: 'Tag',
    cycle_id: 'Cycle',
    q: 'Search',
  };

  return Object.entries(filterState)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${labelMap[key] ?? key}: ${value}`)
    .join(', ');
}

export function SaveFilterDialog({ open, onClose }: SaveFilterDialogProps) {
  const { filterState } = useUiStore();
  const [name, setName] = useState('');
  const { mutate: createFilter, isPending } = useCreateSavedFilter();

  const hasActiveFilter = Object.values(filterState).some(
    (value) => value !== undefined && value !== '',
  );

  const filterPreview = buildFilterPreview(filterState);

  function handleClose() {
    setName('');
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !hasActiveFilter) return;
    createFilter(
      { name: name.trim(), filter_json: JSON.stringify(filterState) },
      { onSuccess: handleClose },
    );
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Save Current Filter</DialogTitle>
        </DialogHeader>

        <DialogContent>
          <div className="space-y-3">
            <Input
              autoFocus
              placeholder="Filter name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            {filterPreview && (
              <p className="text-xs text-muted-foreground bg-muted px-3 py-2 rounded">
                {filterPreview}
              </p>
            )}
          </div>
        </DialogContent>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || !name.trim() || !hasActiveFilter}>
            {isPending ? 'Saving…' : 'Save Filter'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
