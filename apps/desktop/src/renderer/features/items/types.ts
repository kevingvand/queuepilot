import type { Item } from '@queuepilot/core/types';

export type ItemWithCounts = Item & { subtask_total?: number; subtask_done?: number };
