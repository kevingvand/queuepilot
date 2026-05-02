import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
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
  listItemTags,
  listItems,
  removeTagFromItem,
  updateItem,
} from './items.handlers';
import { createComment, listItemComments } from '../comments/comments.handlers';

export const itemsRoutes = new Hono<AppEnv>();

const createCommentBodySchema = z.object({
  body: z.string().min(1),
  author: z.string().optional(),
});

const linkBodySchema = z.object({
  target_item_id: z.string(),
  kind: z.enum(['blocks', 'blocked_by', 'relates_to', 'duplicate']),
});

const createItemBodySchema = z.object({
  title: z.string().min(1),
  body: z.string().optional().nullable(),
  status: z.string().optional(),
  priority: z.number().int().min(0).max(4).optional().nullable(),
  due_at: z.number().int().optional().nullable(),
  scheduled_at: z.number().int().optional().nullable(),
  start_at: z.number().int().optional().nullable(),
  parent_id: z.string().optional().nullable(),
});

const updateItemBodySchema = z.object({
  title: z.string().min(1).optional(),
  body: z.string().optional().nullable(),
  status: z.string().optional(),
  priority: z.number().int().min(0).max(4).optional().nullable(),
  due_at: z.number().int().optional().nullable(),
  scheduled_at: z.number().int().optional().nullable(),
  start_at: z.number().int().optional().nullable(),
  position: z.number().int().optional().nullable(),
  parent_id: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  source_native_id: z.string().optional().nullable(),
});

itemsRoutes.get('/', listItems);
itemsRoutes.post('/', zValidator('json', createItemBodySchema), createItem);
itemsRoutes.get('/:id', getItem);
itemsRoutes.patch('/:id', zValidator('json', updateItemBodySchema as never), updateItem);
itemsRoutes.delete('/:id', discardItem);
itemsRoutes.get('/:id/events', listItemEvents);
itemsRoutes.get('/:id/tags', listItemTags);
itemsRoutes.get('/:id/links', listItemLinks);
itemsRoutes.post('/:id/links', zValidator('json', linkBodySchema), createItemLink);
itemsRoutes.delete('/:id/links/:linkId', deleteItemLink);
itemsRoutes.post('/:id/tags/:tagId', addTagToItem);
itemsRoutes.delete('/:id/tags/:tagId', removeTagFromItem);
itemsRoutes.get('/:id/comments', listItemComments);
itemsRoutes.post('/:id/comments', zValidator('json', createCommentBodySchema), createComment);
