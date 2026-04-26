import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod/v4';
import { itemEvents } from '../schema/events';

export const selectItemEventSchema = createSelectSchema(itemEvents);
export const insertItemEventSchema = createInsertSchema(itemEvents, {
  id: z.string().optional(),
});

export type ItemEvent = z.infer<typeof selectItemEventSchema>;
export type NewItemEvent = z.infer<typeof insertItemEventSchema>;
