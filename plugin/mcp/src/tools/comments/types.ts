import { comments } from '../../schema.js';

export interface CommentRow {
  id: string;
  item_id: string;
  body: string;
  author: string;
  created_at: number;
  updated_at: number;
}

export const COMMENT_COLUMNS = {
  id: comments.id,
  item_id: comments.item_id,
  body: comments.body,
  author: comments.author,
  created_at: comments.created_at,
  updated_at: comments.updated_at,
};
