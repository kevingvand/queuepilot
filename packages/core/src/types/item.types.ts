import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod/v4';
import { items } from '../schema/items';

export const selectItemSchema = createSelectSchema(items);
export const insertItemSchema = createInsertSchema(items, {
  id: z.string().optional(),
});
export const updateItemSchema = insertItemSchema.partial().required({ id: true });

export type Item = z.infer<typeof selectItemSchema>;
export type NewItem = z.infer<typeof insertItemSchema>;
export type UpdateItem = z.infer<typeof updateItemSchema>;

export const VALID_STATUSES = ['inbox', 'todo', 'in_progress', 'review', 'done', 'discarded'] as const;
export type ItemStatus = typeof VALID_STATUSES[number];

export const VALID_TRANSITIONS: Record<string, string[]> = {
  inbox: ['todo', 'discarded'],
  todo: ['in_progress', 'discarded'],
  in_progress: ['review', 'todo', 'discarded'],
  review: ['done', 'in_progress', 'discarded'],
  done: ['in_progress'],
  discarded: ['todo', 'done'],
};
