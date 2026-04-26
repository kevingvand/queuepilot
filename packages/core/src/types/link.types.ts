import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod/v4';
import { itemLinks } from '../schema/links';

export const LinkKind = {
  Blocks: 'blocks',
  BlockedBy: 'blocked_by',
  RelatesTo: 'relates_to',
  Duplicate: 'duplicate',
} as const;

export type LinkKindValue = (typeof LinkKind)[keyof typeof LinkKind];

export const selectItemLinkSchema = createSelectSchema(itemLinks);
export const insertItemLinkSchema = createInsertSchema(itemLinks, {
  id: z.string().optional(),
});

export type ItemLink = z.infer<typeof selectItemLinkSchema>;
export type NewItemLink = z.infer<typeof insertItemLinkSchema>;
