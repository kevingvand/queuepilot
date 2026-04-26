import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { insertTagSchema } from '@queuepilot/core/types';
import type { AppEnv } from '../index';
import { createTag, deleteTag, listTags } from './tags.handlers';

export const tagsRoutes = new Hono<AppEnv>();

tagsRoutes.get('/', listTags);
tagsRoutes.post('/', zValidator('json', insertTagSchema as never), createTag);
tagsRoutes.delete('/:id', deleteTag);
