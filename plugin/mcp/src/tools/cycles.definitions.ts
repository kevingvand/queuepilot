export const CYCLE_TOOL_DEFINITIONS = [
  {
    name: 'list_cycles',
    description:
      'List cycles (sprints/sessions). Use status=active to find the current cycle, status=archived for history. Returns all cycles when no filter is provided.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', description: 'active | archived' },
      },
    },
  },
  {
    name: 'get_cycle',
    description:
      'Look up a cycle by exact ULID or case-insensitive name match. Returns null if not found. Use before set_active_cycle when you only have a name.',
    inputSchema: {
      type: 'object' as const,
      properties: { id_or_name: { type: 'string', description: 'Exact ULID or partial/full cycle name' } },
      required: ['id_or_name'],
    },
  },
  {
    name: 'get_active_cycle',
    description:
      'Return the single active cycle. Returns null if none is active. Call this at the start of a session to establish context before listing items.',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'set_active_cycle',
    description:
      'Make a cycle active and archive all others. Use when resuming a paused cycle. To start a fresh cycle, use create_cycle instead.',
    inputSchema: {
      type: 'object' as const,
      properties: { id: { type: 'string', description: 'Cycle ULID to activate' } },
      required: ['id'],
    },
  },
  {
    name: 'create_cycle',
    description:
      'Create a new active cycle (sprint/session), archiving any currently active cycle. Provide a short name and an optional goal describing what this session aims to accomplish.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Short identifier for this cycle (e.g. "auth-cleanup")' },
        goal: { type: 'string', description: 'Optional sentence describing the session focus' },
      },
      required: ['name'],
    },
  },
  {
    name: 'add_item_to_cycle',
    description:
      'Assign an item to a cycle. An item can only belong to one cycle — calling this reassigns it from any previous cycle.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        item_id: { type: 'string', description: 'Item ULID' },
        cycle_id: { type: 'string', description: 'Cycle ULID' },
      },
      required: ['item_id', 'cycle_id'],
    },
  },
];
