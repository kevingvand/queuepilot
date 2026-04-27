import type { Db } from './db.js';
import { addItem, bumpMentionCount, getItem, listItems, searchItems, updateItem, updateItemStatus } from './tools/items/index.js';
import { addItemToCycle, createCycle, getActiveCycle, getCycle, listCycles, setActiveCycle } from './tools/cycles/index.js';
import { addComment } from './tools/comments/index.js';
import { addTagToItem, listTags, removeTagFromItem } from './tools/tags/index.js';
import { addItemLink, removeItemLink } from './tools/links/index.js';

export function requireString(args: Record<string, unknown>, key: string): string {
  const value = args[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing required argument: "${key}"`);
  }
  return value;
}

export function optionalString(args: Record<string, unknown>, key: string): string | undefined {
  const value = args[key];
  return typeof value === 'string' ? value : undefined;
}

export function optionalInteger(args: Record<string, unknown>, key: string): number | undefined {
  const value = args[key];
  return typeof value === 'number' ? Math.floor(value) : undefined;
}

export function dispatch(db: Db, toolName: string, args: Record<string, unknown>): unknown {
  switch (toolName) {
    case 'search_items':
      return searchItems(
        db,
        optionalString(args, 'q'),
        optionalString(args, 'status'),
        optionalString(args, 'cycle_id'),
        optionalString(args, 'tag'),
        optionalInteger(args, 'priority'),
      );
    case 'list_items':
      return listItems(db, optionalString(args, 'status'), optionalString(args, 'cycle_id'));
    case 'get_item':
      return getItem(db, requireString(args, 'id'));
    case 'add_item':
      return addItem(db, requireString(args, 'title'), optionalString(args, 'body'), {
        priority: optionalInteger(args, 'priority'),
        status: optionalString(args, 'status'),
        parent_id: optionalString(args, 'parent_id'),
        cycle_id: optionalString(args, 'cycle_id'),
        due_at: optionalInteger(args, 'due_at'),
        scheduled_at: optionalInteger(args, 'scheduled_at'),
      });
    case 'update_item':
      return updateItem(db, requireString(args, 'id'), {
        title: optionalString(args, 'title'),
        body: optionalString(args, 'body'),
        priority: optionalInteger(args, 'priority'),
        status: optionalString(args, 'status'),
        parent_id: optionalString(args, 'parent_id'),
        cycle_id: optionalString(args, 'cycle_id'),
        due_at: optionalInteger(args, 'due_at'),
        scheduled_at: optionalInteger(args, 'scheduled_at'),
      });
    case 'update_item_status':
      return updateItemStatus(db, requireString(args, 'id'), requireString(args, 'status'));
    case 'bump_mention_count':
      return bumpMentionCount(db, requireString(args, 'id'));
    case 'list_cycles':
      return listCycles(db, optionalString(args, 'status'));
    case 'get_cycle':
      return getCycle(db, requireString(args, 'id_or_name'));
    case 'get_active_cycle':
      return getActiveCycle(db);
    case 'set_active_cycle':
      return setActiveCycle(db, requireString(args, 'id'));
    case 'create_cycle':
      return createCycle(db, requireString(args, 'name'), optionalString(args, 'goal'));
    case 'add_item_to_cycle':
      return addItemToCycle(db, requireString(args, 'item_id'), requireString(args, 'cycle_id'));
    case 'add_comment':
      return addComment(db, requireString(args, 'item_id'), requireString(args, 'body'));
    case 'list_tags':
      return listTags(db);
    case 'add_tag_to_item':
      return addTagToItem(
        db,
        requireString(args, 'item_id'),
        requireString(args, 'tag_name'),
        optionalString(args, 'color'),
      );
    case 'remove_tag_from_item':
      return removeTagFromItem(db, requireString(args, 'item_id'), requireString(args, 'tag_name'));
    case 'add_item_link':
      return addItemLink(
        db,
        requireString(args, 'item_id'),
        requireString(args, 'target_item_id'),
        requireString(args, 'kind'),
      );
    case 'remove_item_link':
      return removeItemLink(db, requireString(args, 'link_id'));
    default:
      throw new Error(`Unknown tool: "${toolName}"`);
  }
}
