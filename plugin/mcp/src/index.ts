import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { openDb, type Db } from './db.js';
import {
  addItem,
  bumpMentionCount,
  getItem,
  listItems,
  updateItemStatus,
} from './tools/items.js';
import {
  addItemToCycle,
  createCycle,
  getActiveCycle,
  getCycle,
  listCycles,
  setActiveCycle,
} from './tools/cycles.js';

const TOOL_DEFINITIONS = [
  {
    name: 'list_items',
    description: 'List items, optionally filtered by status or cycle',
    inputSchema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', description: 'inbox | todo | in_progress | done | discarded' },
        cycle_id: { type: 'string', description: 'Filter to items in this cycle' },
      },
    },
  },
  {
    name: 'get_item',
    description: 'Get a single item by ID',
    inputSchema: {
      type: 'object' as const,
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },
  {
    name: 'add_item',
    description: 'Create a new item in the inbox',
    inputSchema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string' },
        body: { type: 'string' },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_item_status',
    description: 'Update the status of an item',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string' },
        status: { type: 'string', description: 'inbox | todo | in_progress | done | discarded' },
      },
      required: ['id', 'status'],
    },
  },
  {
    name: 'bump_mention_count',
    description: 'Increment mention count for an item (stub — schema migration required)',
    inputSchema: {
      type: 'object' as const,
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },
  {
    name: 'list_cycles',
    description: 'List cycles, optionally filtered by status',
    inputSchema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', description: 'active | archived | ...' },
      },
    },
  },
  {
    name: 'get_cycle',
    description: 'Get a cycle by exact ID or case-insensitive name',
    inputSchema: {
      type: 'object' as const,
      properties: { id_or_name: { type: 'string' } },
      required: ['id_or_name'],
    },
  },
  {
    name: 'get_active_cycle',
    description: 'Get the most recently created active cycle',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'set_active_cycle',
    description: 'Set a cycle to active status',
    inputSchema: {
      type: 'object' as const,
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },
  {
    name: 'create_cycle',
    description: 'Create a new active cycle',
    inputSchema: {
      type: 'object' as const,
      properties: { name: { type: 'string' } },
      required: ['name'],
    },
  },
  {
    name: 'add_item_to_cycle',
    description: 'Add an item to a cycle',
    inputSchema: {
      type: 'object' as const,
      properties: {
        item_id: { type: 'string' },
        cycle_id: { type: 'string' },
      },
      required: ['item_id', 'cycle_id'],
    },
  },
];

function requireString(args: Record<string, unknown>, key: string): string {
  const value = args[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing required argument: "${key}"`);
  }
  return value;
}

function optionalString(args: Record<string, unknown>, key: string): string | undefined {
  const value = args[key];
  return typeof value === 'string' ? value : undefined;
}

function dispatch(db: Db, toolName: string, args: Record<string, unknown>): unknown {
  switch (toolName) {
    case 'list_items':
      return listItems(db, optionalString(args, 'status'), optionalString(args, 'cycle_id'));
    case 'get_item':
      return getItem(db, requireString(args, 'id'));
    case 'add_item':
      return addItem(db, requireString(args, 'title'), optionalString(args, 'body'));
    case 'update_item_status':
      return updateItemStatus(db, requireString(args, 'id'), requireString(args, 'status'));
    case 'bump_mention_count':
      return bumpMentionCount(requireString(args, 'id'));
    case 'list_cycles':
      return listCycles(db, optionalString(args, 'status'));
    case 'get_cycle':
      return getCycle(db, requireString(args, 'id_or_name'));
    case 'get_active_cycle':
      return getActiveCycle(db);
    case 'set_active_cycle':
      return setActiveCycle(db, requireString(args, 'id'));
    case 'create_cycle':
      return createCycle(db, requireString(args, 'name'));
    case 'add_item_to_cycle':
      return addItemToCycle(db, requireString(args, 'item_id'), requireString(args, 'cycle_id'));
    default:
      throw new Error(`Unknown tool: "${toolName}"`);
  }
}

function runMcpServer(): void {
  const db = openDb();
  const server = new Server(
    { name: 'queuepilot-mcp', version: '0.1.0' },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOL_DEFINITIONS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;
    try {
      const result = dispatch(db, name, args);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ error: message }) }],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  server.connect(transport).catch((error: unknown) => {
    console.error('MCP server failed to start:', error);
    process.exit(1);
  });
}

interface ParsedArgs {
  positionals: string[];
  flags: Record<string, string>;
}

function parseFlags(args: string[]): ParsedArgs {
  const positionals: string[] = [];
  const flags: Record<string, string> = {};

  for (let index = 0; index < args.length; index++) {
    const arg = args[index]!;
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = args[index + 1];
      if (next !== undefined && !next.startsWith('--')) {
        flags[key] = next;
        index++;
      } else {
        flags[key] = 'true';
      }
    } else {
      positionals.push(arg);
    }
  }

  return { positionals, flags };
}

function requirePositional(value: string | undefined, label: string): string {
  if (!value) throw new Error(`Missing required argument: <${label}>`);
  return value;
}

function dispatchCli(
  db: Db,
  subcommand: string,
  positionals: string[],
  flags: Record<string, string>,
): unknown {
  switch (subcommand) {
    case 'list-items':
      return listItems(db, flags['status'], flags['cycle']);
    case 'get-item':
      return getItem(db, requirePositional(positionals[0], 'id'));
    case 'add-item':
      return addItem(db, requirePositional(positionals[0], 'title'), flags['body']);
    case 'update-item-status':
      return updateItemStatus(
        db,
        requirePositional(positionals[0], 'id'),
        requirePositional(positionals[1], 'status'),
      );
    case 'bump-mention-count':
      return bumpMentionCount(requirePositional(positionals[0], 'id'));
    case 'list-cycles':
      return listCycles(db, flags['status']);
    case 'get-cycle':
      return getCycle(db, requirePositional(positionals[0], 'id_or_name'));
    case 'get-active-cycle':
      return getActiveCycle(db);
    case 'set-active-cycle':
      return setActiveCycle(db, requirePositional(positionals[0], 'id'));
    case 'create-cycle':
      // --goal flag accepted for forward compatibility but not yet stored (no schema column)
      return createCycle(db, requirePositional(positionals[0], 'name'));
    case 'add-item-to-cycle':
      return addItemToCycle(
        db,
        requirePositional(positionals[0], 'item_id'),
        requirePositional(positionals[1], 'cycle_id'),
      );
    default:
      throw new Error(`Unknown command: "${subcommand}"`);
  }
}

function runCli(args: string[]): void {
  const [subcommand, ...rest] = args;

  if (!subcommand) {
    console.error('Usage: queuepilot-mcp <command> [args]');
    console.error('Commands: list-items, get-item, add-item, update-item-status,');
    console.error('          bump-mention-count, list-cycles, get-cycle, get-active-cycle,');
    console.error('          set-active-cycle, create-cycle, add-item-to-cycle');
    process.exit(1);
  }

  const { positionals, flags } = parseFlags(rest);

  try {
    const db = openDb();
    const result = dispatchCli(db, subcommand, positionals, flags);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    process.exit(1);
  }
}

const isCli = process.argv.length > 2;
if (isCli) {
  runCli(process.argv.slice(2));
} else {
  runMcpServer();
}
