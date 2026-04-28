export function ShortcutsHelp() {
  return (
    <div style={{ fontSize: '12px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
      <div style={{ marginBottom: '8px', fontWeight: '600', color: 'var(--text-primary)' }}>
        Keyboard Shortcuts
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', fontSize: '11px' }}>
        <kbd style={{ backgroundColor: 'var(--surface-hover)', padding: '2px 4px', borderRadius: '2px', fontFamily: 'monospace' }}>j</kbd>
        <span>Next item</span>

        <kbd style={{ backgroundColor: 'var(--surface-hover)', padding: '2px 4px', borderRadius: '2px', fontFamily: 'monospace' }}>k</kbd>
        <span>Previous item</span>

        <kbd style={{ backgroundColor: 'var(--surface-hover)', padding: '2px 4px', borderRadius: '2px', fontFamily: 'monospace' }}>c</kbd>
        <span>Create new item</span>

        <kbd style={{ backgroundColor: 'var(--surface-hover)', padding: '2px 4px', borderRadius: '2px', fontFamily: 'monospace' }}>⌘k</kbd>
        <span>Focus search</span>

        <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border)', margin: '4px 0' }} />
        <div style={{ gridColumn: '1 / -1', fontWeight: 600, color: 'var(--text-primary)', fontSize: '11px' }}>Kanban Board</div>

        <kbd style={{ backgroundColor: 'var(--surface-hover)', padding: '2px 4px', borderRadius: '2px', fontFamily: 'monospace' }}>1</kbd>
        <span>Move selected → Todo</span>

        <kbd style={{ backgroundColor: 'var(--surface-hover)', padding: '2px 4px', borderRadius: '2px', fontFamily: 'monospace' }}>2</kbd>
        <span>Move selected → In Progress</span>

        <kbd style={{ backgroundColor: 'var(--surface-hover)', padding: '2px 4px', borderRadius: '2px', fontFamily: 'monospace' }}>3</kbd>
        <span>Move selected → Review</span>

        <kbd style={{ backgroundColor: 'var(--surface-hover)', padding: '2px 4px', borderRadius: '2px', fontFamily: 'monospace' }}>4</kbd>
        <span>Move selected → Done</span>

        <kbd style={{ backgroundColor: 'var(--surface-hover)', padding: '2px 4px', borderRadius: '2px', fontFamily: 'monospace' }}>5</kbd>
        <span>Move selected → Cancelled</span>
      </div>
    </div>
  );
}
