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
