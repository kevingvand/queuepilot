import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Db } from '../../db.js';
import { comments } from '../../schema.js';
import { COMMENT_COLUMNS, type CommentRow } from './types.js';

export const definition = {
  name: 'add_comment',
  description:
    'Append a comment to an existing item. Use when an idea surfaces that adds context to a known item — preserves the original item while recording the new thought as a comment.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      item_id: { type: 'string', description: 'The ULID of the item to comment on' },
      body: { type: 'string', description: 'The comment text' },
    },
    required: ['item_id', 'body'],
  },
};

export function addComment(
  db: Db,
  itemId: string,
  body: string,
): { success: true; comment: CommentRow } | { success: false; message: string } {
  const id = ulid();
  const now = Date.now();

  db.insert(comments)
    .values({ id, item_id: itemId, body, author: 'copilot', created_at: now, updated_at: now })
    .run();

  const row = db.select(COMMENT_COLUMNS).from(comments).where(eq(comments.id, id)).get();
  if (!row) throw new Error(`Failed to retrieve comment after insert: ${id}`);
  return { success: true, comment: row };
}
