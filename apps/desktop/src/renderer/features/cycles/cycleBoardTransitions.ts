import { VALID_TRANSITIONS } from '@queuepilot/core/types';

export { VALID_TRANSITIONS };

export function resolveTargetStatus(columnId: string, draggedStatus: string): string | null {
  if (columnId === 'todo') return 'todo';
  if (columnId === 'in_progress') return 'in_progress';
  if (columnId === 'review') return 'review';
  if (columnId === 'done') {
    if (VALID_TRANSITIONS[draggedStatus]?.includes('done')) return 'done';
    return null; // block everything else — no silent discard
  }
  return null;
}

export function itemStatusToColumn(status: string): string {
  if (status === 'inbox' || status === 'todo') return 'todo';
  if (status === 'in_progress') return 'in_progress';
  if (status === 'review') return 'review';
  if (status === 'done' || status === 'discarded') return 'done';
  return 'todo';
}
