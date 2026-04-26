import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { cn } from '../../lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface ShortcutRow {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  heading: string;
  shortcuts: ShortcutRow[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    heading: 'Navigation',
    shortcuts: [
      { keys: ['j'], description: 'Next item' },
      { keys: ['k'], description: 'Previous item' },
      { keys: ['↑', '↓'], description: 'Next / previous item' },
    ],
  },
  {
    heading: 'Actions',
    shortcuts: [
      { keys: ['c'], description: 'Create new item' },
      { keys: ['/', '⌘K'], description: 'Focus search' },
      { keys: ['?'], description: 'Show shortcuts' },
    ],
  },
  {
    heading: 'Item',
    shortcuts: [
      { keys: ['Enter'], description: 'Open selected item' },
      { keys: ['Escape'], description: 'Deselect item' },
    ],
  },
  {
    heading: 'Filtering',
    shortcuts: [
      { keys: ['1'], description: 'Filter: Inbox' },
      { keys: ['2'], description: 'Filter: In Progress' },
      { keys: ['3'], description: 'Filter: Done' },
      { keys: ['0'], description: 'Clear filters' },
    ],
  },
];

function ShortcutGroupSection({ group }: { group: ShortcutGroup }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {group.heading}
      </h3>
      <ul className="flex flex-col gap-1">
        {group.shortcuts.map((row) => (
          <li key={row.description} className="flex items-center justify-between gap-4">
            <span className="text-sm text-foreground">{row.description}</span>
            <span className="flex shrink-0 items-center gap-1">
              {row.keys.map((key) => (
                <kbd
                  key={key}
                  className={cn(
                    'rounded border border-border bg-muted px-1.5 py-0.5',
                    'font-mono text-xs text-muted-foreground',
                  )}
                >
                  {key}
                </kbd>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ShortcutsOverlay({ open, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Keyboard Shortcuts</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <div className="grid grid-cols-2 gap-x-10 gap-y-6">
          {SHORTCUT_GROUPS.map((group) => (
            <ShortcutGroupSection key={group.heading} group={group} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
