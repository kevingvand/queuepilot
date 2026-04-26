import { Hono } from 'hono';
import type { Db } from '@queuepilot/core/schema';
import { itemsRoutes } from './items/items.routes';
import { tagsRoutes } from './tags/tags.routes';
import { commentsRoutes } from './comments/comments.routes';
import { cyclesRoutes } from './cycles/cycles.routes';
import { filtersRoutes } from './filters/filters.routes';
import { sourcesRoutes } from './sources/sources.routes';

export type AppEnv = { Variables: { db: Db } };

export function createApp(db: Db) {
  const app = new Hono<AppEnv>();

  app.use('*', async (c, next) => {
    c.set('db', db);
    await next();
  });

  app.route('/items', itemsRoutes);
  app.route('/tags', tagsRoutes);
  app.route('/comments', commentsRoutes);
  app.route('/cycles', cyclesRoutes);
  app.route('/filters', filtersRoutes);
  app.route('/sources', sourcesRoutes);

  return app;
}

export type AppType = ReturnType<typeof createApp>;
