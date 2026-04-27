import { and, eq, like, or, sql } from 'drizzle-orm';
import type { Db } from '../../db.js';
import { items, itemTags, tags } from '../../schema.js';
import { ITEM_COLUMNS, type ItemRow } from './types.js';

export const definition = {
  name: 'search_items',
  description:
    'Search QueuePilot items by keyword and/or filter by status, tag, cycle, or priority. Use q for full-text search across title and body. All filters are optional and combined with AND.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      q: { type: 'string', description: 'Keyword to search in title and body (case-insensitive)' },
      status: { type: 'string', description: 'inbox | todo | in_progress | done | discarded' },
      cycle_id: { type: 'string', description: 'Filter to items in this cycle ULID' },
      tag: { type: 'string', description: 'Filter to items with this tag name (case-insensitive)' },
      priority: { type: 'number', description: '0=none 1=low 2=medium 3=high' },
    },
  },
};

export function searchItems(
  db: Db,
  q?: string,
  status?: string,
  cycleId?: string,
  tag?: string,
  priority?: number,
): { items: ItemRow[] } {
  const conditions = [];

  if (q) {
    const pattern = `%${q}%`;
    conditions.push(or(like(items.title, pattern), like(items.body, pattern)));
  }

  if (status !== undefined) {
    conditions.push(eq(items.status, status));
  }

  if (cycleId !== undefined) {
    conditions.push(eq(items.cycle_id, cycleId));
  }

  if (priority !== undefined) {
    conditions.push(eq(items.priority, priority));
  }

  if (tag !== undefined) {
    // Subquery: items that have a tag matching the given name
    const taggedItemIds = db
      .select({ item_id: itemTags.item_id })
      .from(itemTags)
      .innerJoin(tags, and(eq(itemTags.tag_id, tags.id), like(tags.name, tag)))
      .all()
      .map((r) => r.item_id);

    if (taggedItemIds.length === 0) {
      return { items: [] };
    }

    conditions.push(sql`${items.id} IN (${sql.join(taggedItemIds.map((id) => sql`${id}`), sql`, `)})`);
  }

  const rows =
    conditions.length > 0
      ? db
          .select(ITEM_COLUMNS)
          .from(items)
          .where(and(...conditions))
          .all()
      : db.select(ITEM_COLUMNS).from(items).all();

  return { items: rows };
}
