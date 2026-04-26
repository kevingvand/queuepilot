import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { insertSavedFilterSchema } from '@queuepilot/core/types';
import type { AppEnv } from '../index';
import { createFilter, deleteFilter, listFilters, updateFilter } from './filters.handlers';

export const filtersRoutes = new Hono<AppEnv>();

filtersRoutes.get('/', listFilters);
filtersRoutes.post('/', zValidator('json', insertSavedFilterSchema as never), createFilter);
filtersRoutes.patch('/:id', zValidator('json', insertSavedFilterSchema.partial() as never), updateFilter);
filtersRoutes.delete('/:id', deleteFilter);
