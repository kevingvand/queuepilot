import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod/v4';
import { syncLog, syncTargets } from '../schema/sync';

export const selectSyncTargetSchema = createSelectSchema(syncTargets);
export const insertSyncTargetSchema = createInsertSchema(syncTargets, {
  id: z.string().optional(),
});

export const selectSyncLogSchema = createSelectSchema(syncLog);
export const insertSyncLogSchema = createInsertSchema(syncLog, {
  id: z.string().optional(),
});

export type SyncTarget = z.infer<typeof selectSyncTargetSchema>;
export type NewSyncTarget = z.infer<typeof insertSyncTargetSchema>;
export type SyncLog = z.infer<typeof selectSyncLogSchema>;
export type NewSyncLog = z.infer<typeof insertSyncLogSchema>;
