import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Db } from '../../db.js';
import { itemLinks } from '../../schema.js';
import { LINK_COLUMNS, VALID_LINK_KINDS, type LinkRow } from './types.js';

export const definition = {
  name: 'add_item_link',
  description: 'Create a directional relationship between two items.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      item_id: { type: 'string', description: 'Source item ULID' },
      target_item_id: { type: 'string', description: 'Target item ULID' },
      kind: {
        type: 'string',
        description: 'blocks | blocked_by | relates_to | duplicate',
      },
    },
    required: ['item_id', 'target_item_id', 'kind'],
  },
};

export function addItemLink(
  db: Db,
  itemId: string,
  targetItemId: string,
  kind: string,
): { link: LinkRow } | { success: false; message: string } {
  if (!(VALID_LINK_KINDS as readonly string[]).includes(kind)) {
    return {
      success: false,
      message: `Invalid kind "${kind}". Valid values: ${VALID_LINK_KINDS.join(', ')}`,
    };
  }

  const id = ulid();
  const now = Date.now();

  db.insert(itemLinks)
    .values({ id, source_item_id: itemId, target_item_id: targetItemId, kind, created_at: now })
    .run();

  const row = db.select(LINK_COLUMNS).from(itemLinks).where(eq(itemLinks.id, id)).get();
  if (!row) throw new Error(`Failed to retrieve link after insert: ${id}`);
  return { link: row };
}
