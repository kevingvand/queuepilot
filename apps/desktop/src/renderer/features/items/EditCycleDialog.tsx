import { useEffect, useState } from 'react';
import type { Cycle, NewCycle } from '@queuepilot/core/types';
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
import { useUpdateCycle } from './hooks/useCycles';

type EditCycleDialogProps = {
  cycle: Cycle | null;
  onClose: () => void;
};

type CycleStatus = 'planned' | 'active' | 'completed';

function msFromDateString(dateString: string): number {
  return new Date(dateString).getTime();
}

function dateStringFromMs(ms: number | null): string {
  if (!ms) return '';
  return new Date(ms).toISOString().split('T')[0];
}

export function EditCycleDialog({ cycle, onClose }: EditCycleDialogProps) {
  const [name, setName] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [status, setStatus] = useState<CycleStatus>('planned');
  const [validationError, setValidationError] = useState('');
  const { mutate: updateCycle, isPending } = useUpdateCycle();

  const isOpen = cycle !== null;

  useEffect(() => {
    if (cycle) {
      setName(cycle.name);
      setStartsAt(dateStringFromMs(cycle.starts_at));
      setEndsAt(dateStringFromMs(cycle.ends_at));
      setStatus((cycle.status as CycleStatus) ?? 'planned');
      setValidationError('');
    }
  }, [cycle]);

  function handleClose() {
    setValidationError('');
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cycle) return;
    setValidationError('');

    if (!name.trim()) {
      setValidationError('Name is required.');
      return;
    }
    if (!startsAt || !endsAt) {
      setValidationError('Start and end dates are required.');
      return;
    }
    if (msFromDateString(endsAt) <= msFromDateString(startsAt)) {
      setValidationError('End date must be after start date.');
      return;
    }

    const data = {
      name: name.trim(),
      status,
      starts_at: msFromDateString(startsAt),
      ends_at: msFromDateString(endsAt),
    } satisfies Partial<NewCycle>;

    updateCycle({ id: cycle.id, data }, { onSuccess: handleClose });
  }

  return (
    <Dialog open={isOpen} onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Edit Cycle</DialogTitle>
        </DialogHeader>

        <DialogContent>
          <div className="space-y-3">
            <Input
              autoFocus
              placeholder="Cycle name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Start date</label>
                <Input
                  type="date"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">End date</label>
                <Input
                  type="date"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Status</label>
              <Select value={status} onChange={(value) => setStatus(value as CycleStatus)}>
                <option value="planned">Planned</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </Select>
            </div>

            {validationError && (
              <p className="text-xs text-red-400">{validationError}</p>
            )}
          </div>
        </DialogContent>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
