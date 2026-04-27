import { eq } from 'drizzle-orm';
import type { Db } from '../../db.js';
import { itemLinks } from '../../schema.js';

export const definition = {
  name: 'remove_item_link',
  description: 'Remove a link between two items by its link ID.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      link_id: { type: 'string', description: 'Link ULID to delete' },
    },
    required: ['link_id'],
  },
};

export function removeItemLink(
  db: Db,
  linkId: string,
): { success: true } {
  db.delete(itemLinks).where(eq(itemLinks.id, linkId)).run();
  return { success: true };
}
