import { definition as addItemDefinition, addItem } from './add.js';
import { definition as bumpMentionDefinition, bumpMentionCount } from './bump-mention.js';
import { definition as getItemDefinition, getItem } from './get.js';
import { definition as listItemsDefinition, listItems } from './list.js';
import { definition as searchItemsDefinition, searchItems } from './search.js';
import { definition as updateItemDefinition, updateItem } from './update.js';
import { definition as updateStatusDefinition, updateItemStatus } from './update-status.js';

export const ITEM_TOOL_DEFINITIONS = [
  listItemsDefinition,
  searchItemsDefinition,
  getItemDefinition,
  addItemDefinition,
  updateItemDefinition,
  updateStatusDefinition,
  bumpMentionDefinition,
];

export { listItems, searchItems, getItem, addItem, updateItem, updateItemStatus, bumpMentionCount };
