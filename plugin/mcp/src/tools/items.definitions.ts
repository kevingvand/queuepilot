export const ITEM_TOOL_DEFINITIONS = [
  {
    name: 'list_items',
    description:
      'List QueuePilot items. Filter by status (inbox | todo | in_progress | done | discarded) to see work at a specific stage, or by cycle_id to see only items belonging to a sprint. Returns all items when no filter is provided.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', description: 'inbox | todo | in_progress | done | discarded' },
        cycle_id: { type: 'string', description: 'Return only items assigned to this cycle ULID' },
      },
    },
  },
  {
    name: 'get_item',
    description:
      'Fetch full details of a single item by its ULID. Use when you need the body, priority, timestamps, or mention count of a specific item.',
    inputSchema: {
      type: 'object' as const,
      properties: { id: { type: 'string', description: 'Item ULID' } },
      required: ['id'],
    },
  },
  {
    name: 'add_item',
    description:
      'Create a new item in the inbox. Provide a short title and an optional body with more context. Items start with status=inbox and are surfaced during triage.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Short summary of the idea or task' },
        body: { type: 'string', description: 'Optional longer description or context' },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_item_status',
    description:
      'Transition an item through its lifecycle: inbox → todo → in_progress → done | discarded. Also updates last_touched_at so the item surfaces as recently active.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Item ULID' },
        status: { type: 'string', description: 'inbox | todo | in_progress | done | discarded' },
      },
      required: ['id', 'status'],
    },
  },
  {
    name: 'bump_mention_count',
    description:
      'Record that an item was mentioned during this session. Increments mention_count and updates last_touched_at — used by the park skill to track recurring ideas without creating duplicates.',
    inputSchema: {
      type: 'object' as const,
      properties: { id: { type: 'string', description: 'Item ULID' } },
      required: ['id'],
    },
  },
];
