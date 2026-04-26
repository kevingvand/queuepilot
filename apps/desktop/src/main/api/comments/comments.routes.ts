import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppEnv } from '../index';
import { deleteComment, updateComment } from './comments.handlers';

export const commentsRoutes = new Hono<AppEnv>();

const updateCommentBodySchema = z.object({ body: z.string().min(1) });

commentsRoutes.patch('/:id', zValidator('json', updateCommentBodySchema), updateComment);
commentsRoutes.delete('/:id', deleteComment);
