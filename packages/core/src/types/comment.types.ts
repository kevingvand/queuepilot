import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod/v4';
import { comments } from '../schema/comments';

export const selectCommentSchema = createSelectSchema(comments);
export const insertCommentSchema = createInsertSchema(comments, {
  id: z.string().optional(),
});
export const updateCommentSchema = insertCommentSchema.partial().required({ id: true });

export type Comment = z.infer<typeof selectCommentSchema>;
export type NewComment = z.infer<typeof insertCommentSchema>;
export type UpdateComment = z.infer<typeof updateCommentSchema>;
