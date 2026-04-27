import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { openDb } from './db.js';
import { dispatch } from './dispatch.js';
import { ITEM_TOOL_DEFINITIONS } from './tools/items/index.js';
import { CYCLE_TOOL_DEFINITIONS } from './tools/cycles/index.js';
import { COMMENT_TOOL_DEFINITIONS } from './tools/comments/index.js';

const TOOL_DEFINITIONS = [
  ...ITEM_TOOL_DEFINITIONS,
  ...CYCLE_TOOL_DEFINITIONS,
  ...COMMENT_TOOL_DEFINITIONS,
];

export function runMcpServer(): void {
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
