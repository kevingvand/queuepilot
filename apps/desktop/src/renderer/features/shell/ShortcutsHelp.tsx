import type { ReactNode } from 'react';

function ShortcutKey({ children }: { children: ReactNode }) {
  return (
    <kbd className="bg-accent px-1 py-0.5 rounded-sm font-mono text-xs text-text-primary">
      {children}
    </kbd>
  );
}

export function ShortcutsHelp() {
  return (
    <div className="text-xs leading-relaxed text-text-secondary">
      <div className="mb-2 font-semibold text-text-primary">Keyboard Shortcuts</div>
      <div className="grid gap-x-4 gap-y-2" style={{ gridTemplateColumns: 'auto 1fr' }}>
        <ShortcutKey>j</ShortcutKey>
        <span>Next item</span>

        <ShortcutKey>k</ShortcutKey>
        <span>Previous item</span>

        <ShortcutKey>c</ShortcutKey>
        <span>Create new item</span>

        <ShortcutKey>⌘k</ShortcutKey>
        <span>Focus search</span>

        <div className="col-span-2 border-t border-border my-1" />
        <div className="col-span-2 font-semibold text-text-primary text-[11px]">Kanban Board</div>

        <ShortcutKey>1</ShortcutKey>
        <span>Move selected → Todo</span>

        <ShortcutKey>2</ShortcutKey>
        <span>Move selected → In Progress</span>

        <ShortcutKey>3</ShortcutKey>
        <span>Move selected → Review</span>

        <ShortcutKey>4</ShortcutKey>
        <span>Move selected → Done</span>

        <ShortcutKey>5</ShortcutKey>
        <span>Move selected → Cancelled</span>
      </div>
    </div>
  );
}
