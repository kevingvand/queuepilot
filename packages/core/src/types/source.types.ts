import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod/v4';
import { sources } from '../schema/sources';

export const selectSourceSchema = createSelectSchema(sources);
export const insertSourceSchema = createInsertSchema(sources, {
  id: z.string().optional(),
});

export type Source = z.infer<typeof selectSourceSchema>;
export type NewSource = z.infer<typeof insertSourceSchema>;
