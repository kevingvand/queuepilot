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
        <span>Search (coming soon)</span>
      </div>
    </div>
  );
}
