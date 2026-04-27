import { openDb } from './db.js';
import { dispatch, requireString } from './dispatch.js';

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

function flagsToArgs(
  subcommand: string,
  positionals: string[],
  flags: Record<string, string>,
): Record<string, unknown> {
  switch (subcommand) {
    case 'list-items':
      return { status: flags['status'], cycle_id: flags['cycle'] };
    case 'get-item':
      return { id: requirePositional(positionals[0], 'id') };
    case 'add-item':
      return { title: requirePositional(positionals[0], 'title'), body: flags['body'] };
    case 'update-item-status':
      return {
        id: requirePositional(positionals[0], 'id'),
        status: requirePositional(positionals[1], 'status'),
      };
    case 'bump-mention-count':
      return { id: requirePositional(positionals[0], 'id') };
    case 'list-cycles':
      return { status: flags['status'] };
    case 'get-cycle':
      return { id_or_name: requirePositional(positionals[0], 'id_or_name') };
    case 'get-active-cycle':
      return {};
    case 'set-active-cycle':
      return { id: requirePositional(positionals[0], 'id') };
    case 'create-cycle':
      return { name: requirePositional(positionals[0], 'name'), goal: flags['goal'] };
    case 'add-item-to-cycle':
      return {
        item_id: requirePositional(positionals[0], 'item_id'),
        cycle_id: requirePositional(positionals[1], 'cycle_id'),
      };
    case 'add-comment':
      return {
        item_id: requireString(flags as Record<string, unknown>, 'item-id'),
        body: requirePositional(positionals[0], 'body'),
      };
    default:
      throw new Error(`Unknown command: "${subcommand}"`);
  }
}

function cliToolName(subcommand: string): string {
  return subcommand.replace(/-/g, '_');
}

export function runCli(args: string[]): void {
  const [subcommand, ...rest] = args;

  if (!subcommand) {
    console.error('Usage: queuepilot-mcp <command> [args]');
    console.error('Commands: list-items, get-item, add-item, update-item-status,');
    console.error('          bump-mention-count, list-cycles, get-cycle, get-active-cycle,');
    console.error('          set-active-cycle, create-cycle, add-item-to-cycle, add-comment');
    process.exit(1);
  }

  const { positionals, flags } = parseFlags(rest);

  try {
    const db = openDb();
    const toolArgs = flagsToArgs(subcommand, positionals, flags);
    const result = dispatch(db, cliToolName(subcommand), toolArgs);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    process.exit(1);
  }
}
