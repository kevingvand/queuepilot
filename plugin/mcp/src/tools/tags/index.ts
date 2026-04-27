import { definition as addTagToItemDefinition, addTagToItem } from './add-to-item.js';
import { definition as listTagsDefinition, listTags } from './list.js';
import { definition as removeTagFromItemDefinition, removeTagFromItem } from './remove-from-item.js';

export const TAG_TOOL_DEFINITIONS = [
  listTagsDefinition,
  addTagToItemDefinition,
  removeTagFromItemDefinition,
];

export { listTags, addTagToItem, removeTagFromItem };
