import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { insertSourceSchema } from '@queuepilot/core/types';
import type { AppEnv } from '../index';
import { createSource, deleteSource, listSources } from './sources.handlers';

export const sourcesRoutes = new Hono<AppEnv>();

sourcesRoutes.get('/', listSources);
sourcesRoutes.post('/', zValidator('json', insertSourceSchema as never), createSource);
sourcesRoutes.delete('/:id', deleteSource);
