import { eq, sql } from 'drizzle-orm';
import type { Db } from '../../db.js';
import { items } from '../../schema.js';

export const definition = {
  name: 'bump_mention_count',
  description:
    'Record that an item was mentioned during this session. Increments mention_count and updates last_touched_at — used by the park skill to track recurring ideas without creating duplicates.',
  inputSchema: {
    type: 'object' as const,
    properties: { id: { type: 'string', description: 'Item ULID' } },
    required: ['id'],
  },
};

export function bumpMentionCount(
  db: Db,
  id: string,
): { success: true } | { success: false; message: string } {
  const existing = db.select({ id: items.id }).from(items).where(eq(items.id, id)).get();
  if (!existing) {
    return { success: false, message: `Item "${id}" not found` };
  }

  db.update(items)
    .set({
      mention_count: sql`${items.mention_count} + 1`,
      last_touched_at: Date.now(),
      updated_at: Date.now(),
    })
    .where(eq(items.id, id))
    .run();

  return { success: true };
}
