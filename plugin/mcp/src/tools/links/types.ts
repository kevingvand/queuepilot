import { itemLinks } from '../../schema.js';

export interface LinkRow {
  id: string;
  source_item_id: string;
  target_item_id: string;
  kind: string;
  created_at: number;
}

export const LINK_COLUMNS = {
  id: itemLinks.id,
  source_item_id: itemLinks.source_item_id,
  target_item_id: itemLinks.target_item_id,
  kind: itemLinks.kind,
  created_at: itemLinks.created_at,
};

export const VALID_LINK_KINDS = ['blocks', 'blocked_by', 'relates_to', 'duplicate'] as const;
