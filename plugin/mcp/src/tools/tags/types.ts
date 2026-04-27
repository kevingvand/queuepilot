import { tags, itemTags } from '../../schema.js';

export interface TagRow {
  id: string;
  name: string;
  color: string;
  created_at: number;
}

export const TAG_COLUMNS = {
  id: tags.id,
  name: tags.name,
  color: tags.color,
  created_at: tags.created_at,
};

export const ITEM_TAGS_TABLE = itemTags;
