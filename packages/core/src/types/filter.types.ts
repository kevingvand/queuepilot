import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod/v4';
import { savedFilters } from '../schema/filters';

export const selectSavedFilterSchema = createSelectSchema(savedFilters);
export const insertSavedFilterSchema = createInsertSchema(savedFilters, {
  id: z.string().optional(),
});
export const updateSavedFilterSchema = insertSavedFilterSchema.partial().required({ id: true });

export type SavedFilter = z.infer<typeof selectSavedFilterSchema>;
export type NewSavedFilter = z.infer<typeof insertSavedFilterSchema>;
export type UpdateSavedFilter = z.infer<typeof updateSavedFilterSchema>;
