import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { insertCycleSchema } from '@queuepilot/core/types';
import type { AppEnv } from '../index';
import {
  addItemToCycle,
  createCycle,
  deleteCycle,
  listCycleItems,
  listCycles,
  removeItemFromCycle,
  updateCycle,
} from './cycles.handlers';

export const cyclesRoutes = new Hono<AppEnv>();

const addItemBodySchema = z.object({ item_id: z.string() });

cyclesRoutes.get('/', listCycles);
cyclesRoutes.post('/', zValidator('json', insertCycleSchema as never), createCycle);
cyclesRoutes.patch('/:id', zValidator('json', insertCycleSchema.partial() as never), updateCycle);
cyclesRoutes.delete('/:id', deleteCycle);
cyclesRoutes.get('/:id/items', listCycleItems);
cyclesRoutes.post('/:id/items', zValidator('json', addItemBodySchema), addItemToCycle);
cyclesRoutes.delete('/:id/items/:itemId', removeItemFromCycle);
