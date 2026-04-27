import type { Cycle } from '@queuepilot/core/types';

export function CycleBoardHeader({
  cycle,
  search,
  onSearchChange,
}: {
  cycle: Cycle | undefined;
  search: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
      {cycle ? (
        <>
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            {cycle.name}
          </h2>
          {cycle.goal && (
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-muted)',
                marginTop: '2px',
                marginBottom: '8px',
              }}
            >
              {cycle.goal}
            </p>
          )}
        </>
      ) : (
        <h2
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            margin: '0 0 8px 0',
          }}
        >
          Cycle Board
        </h2>
      )}
      <input
        placeholder="Search…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{
          width: '100%',
          padding: '6px 10px',
          borderRadius: '6px',
          border: '1px solid var(--border)',
          backgroundColor: 'var(--surface)',
          color: 'var(--text-primary)',
          fontSize: '13px',
          outline: 'none',
          marginTop: cycle?.goal ? '0' : '4px',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}
