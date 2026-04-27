import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Db } from '../../db.js';
import { tags, itemTags } from '../../schema.js';
import { TAG_COLUMNS, type TagRow } from './types.js';

export const definition = {
  name: 'add_tag_to_item',
  description:
    'Add a tag to an item. The tag is created if it does not exist.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      item_id: { type: 'string', description: 'Item ULID' },
      tag_name: { type: 'string', description: 'Tag name, created if it does not exist' },
      color: {
        type: 'string',
        description: 'Hex color like #6366f1, used only when creating a new tag',
      },
    },
    required: ['item_id', 'tag_name'],
  },
};

export function addTagToItem(
  db: Db,
  itemId: string,
  tagName: string,
  color?: string,
): { tag: TagRow; created: boolean } {
  const existing = db.select(TAG_COLUMNS).from(tags).where(eq(tags.name, tagName)).get();

  let tag: TagRow;
  let created: boolean;

  if (existing) {
    tag = existing;
    created = false;
  } else {
    const id = ulid();
    const now = Date.now();
    db.insert(tags)
      .values({ id, name: tagName, color: color ?? '#6b7280', created_at: now })
      .run();
    const row = db.select(TAG_COLUMNS).from(tags).where(eq(tags.id, id)).get();
    if (!row) throw new Error(`Failed to retrieve tag after insert: ${id}`);
    tag = row;
    created = true;
  }

  db.insert(itemTags)
    .values({ item_id: itemId, tag_id: tag.id })
    .onConflictDoNothing()
    .run();

  return { tag, created };
}
