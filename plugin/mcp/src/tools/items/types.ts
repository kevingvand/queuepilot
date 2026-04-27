import { cycleItems, items } from '../../schema.js';

export interface ItemRow {
  id: string;
  title: string;
  body: string;
  status: string;
  priority: number;
  parent_id: string | null;
  cycle_id: string | null;
  due_at: number | null;
  scheduled_at: number | null;
  start_at: number | null;
  mention_count: number;
  last_touched_at: number | null;
  created_at: number;
  updated_at: number;
}

export const ITEM_COLUMNS = {
  id: items.id,
  title: items.title,
  body: items.body,
  status: items.status,
  priority: items.priority,
  parent_id: items.parent_id,
  cycle_id: items.cycle_id,
  due_at: items.due_at,
  scheduled_at: items.scheduled_at,
  start_at: items.start_at,
  mention_count: items.mention_count,
  last_touched_at: items.last_touched_at,
  created_at: items.created_at,
  updated_at: items.updated_at,
};

export const CYCLE_ITEMS_TABLE = cycleItems;

export const VALID_STATUSES = ['inbox', 'todo', 'in_progress', 'review', 'done', 'discarded'] as const;
