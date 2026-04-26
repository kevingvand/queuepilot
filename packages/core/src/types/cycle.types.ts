import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod/v4';
import { cycleItems, cycles } from '../schema/cycles';

export const selectCycleSchema = createSelectSchema(cycles);
export const insertCycleSchema = createInsertSchema(cycles, {
  id: z.string().optional(),
});

export const selectCycleItemSchema = createSelectSchema(cycleItems);
export const insertCycleItemSchema = createInsertSchema(cycleItems);

export type Cycle = z.infer<typeof selectCycleSchema>;
export type NewCycle = z.infer<typeof insertCycleSchema>;
export type CycleItem = z.infer<typeof selectCycleItemSchema>;
