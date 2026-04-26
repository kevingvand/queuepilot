import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { insertCommentSchema, insertItemSchema } from '@queuepilot/core/types';
import type { AppEnv } from '../index';
import {
  addTagToItem,
  createItem,
  createItemLink,
  deleteItemLink,
  discardItem,
  getItem,
  listItemEvents,
  listItemLinks,
  listItems,
  removeTagFromItem,
  updateItem,
} from './items.handlers';
import { createComment, listItemComments } from '../comments/comments.handlers';

export const itemsRoutes = new Hono<AppEnv>();

const linkBodySchema = z.object({
  target_item_id: z.string(),
  kind: z.enum(['blocks', 'blocked_by', 'relates_to', 'duplicate']),
});

itemsRoutes.get('/', listItems);
itemsRoutes.post('/', zValidator('json', insertItemSchema as never), createItem);
itemsRoutes.get('/:id', getItem);
itemsRoutes.patch('/:id', zValidator('json', insertItemSchema.partial() as never), updateItem);
itemsRoutes.delete('/:id', discardItem);
itemsRoutes.get('/:id/events', listItemEvents);
itemsRoutes.get('/:id/links', listItemLinks);
itemsRoutes.post('/:id/links', zValidator('json', linkBodySchema), createItemLink);
itemsRoutes.delete('/:id/links/:linkId', deleteItemLink);
itemsRoutes.post('/:id/tags/:tagId', addTagToItem);
itemsRoutes.delete('/:id/tags/:tagId', removeTagFromItem);
itemsRoutes.get('/:id/comments', listItemComments);
itemsRoutes.post('/:id/comments', zValidator('json', insertCommentSchema as never), createComment);
