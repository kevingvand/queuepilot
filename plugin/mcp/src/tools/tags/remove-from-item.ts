import { and, eq } from 'drizzle-orm';
import type { Db } from '../../db.js';
import { tags, itemTags } from '../../schema.js';

export const definition = {
  name: 'remove_tag_from_item',
  description: 'Remove a tag from an item.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      item_id: { type: 'string', description: 'Item ULID' },
      tag_name: { type: 'string', description: 'Tag name to remove' },
    },
    required: ['item_id', 'tag_name'],
  },
};

export function removeTagFromItem(
  db: Db,
  itemId: string,
  tagName: string,
): { success: true } | { success: false; message: string } {
  const tag = db
    .select({ id: tags.id })
    .from(tags)
    .where(eq(tags.name, tagName))
    .get();

  if (!tag) {
    return { success: false, message: `Tag "${tagName}" not found` };
  }

  db.delete(itemTags)
    .where(and(eq(itemTags.item_id, itemId), eq(itemTags.tag_id, tag.id)))
    .run();

  return { success: true };
}
