import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod/v4';
import { itemTags, tags } from '../schema/tags';

export const selectTagSchema = createSelectSchema(tags);
export const insertTagSchema = createInsertSchema(tags, {
  id: z.string().optional(),
});

export const selectItemTagSchema = createSelectSchema(itemTags);
export const insertItemTagSchema = createInsertSchema(itemTags);

export type Tag = z.infer<typeof selectTagSchema>;
export type NewTag = z.infer<typeof insertTagSchema>;
export type ItemTag = z.infer<typeof selectItemTagSchema>;
