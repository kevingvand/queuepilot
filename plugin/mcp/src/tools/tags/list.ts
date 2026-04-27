import type { Db } from '../../db.js';
import { tags } from '../../schema.js';
import { TAG_COLUMNS, type TagRow } from './types.js';

export const definition = {
  name: 'list_tags',
  description:
    'List all available tags. Use this to find tag IDs before adding tags to items.',
  inputSchema: {
    type: 'object' as const,
    properties: {},
    required: [],
  },
};

export function listTags(db: Db): { tags: TagRow[] } {
  const rows = db.select(TAG_COLUMNS).from(tags).all();
  return { tags: rows };
}
