import { useEffect, useRef } from 'react';
import type { Cycle } from '@queuepilot/core/types';
import type { Tag } from '@queuepilot/core/types';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
const searchShortcut = isMac ? '⌘K' : 'Ctrl+K';

export function CycleBoardHeader({
  cycle,
  search,
  onSearchChange,
  tags = [],
  selectedTagIds = [],
  onTagSelect,
}: {
  cycle: Cycle | undefined;
  search: string;
  onSearchChange: (value: string) => void;
  tags?: Tag[];
  selectedTagIds?: string[];
  onTagSelect: (tagId: string) => void;
}) {
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isModKey = isMac ? e.metaKey : e.ctrlKey;
      if (!isModKey || e.key !== 'k') return;
      e.preventDefault();
      searchRef.current?.focus();
      searchRef.current?.select();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

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

      <div style={{ position: 'relative', marginTop: cycle?.goal ? '0' : '4px' }}>
        <input
          ref={searchRef}
          placeholder="Search…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 10px',
            paddingRight: !search ? '52px' : '10px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            color: 'var(--text-primary)',
            fontSize: '13px',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 150ms, box-shadow 150ms',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--accent)';
            e.target.style.boxShadow = '0 0 0 2px rgba(99, 102, 241, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--border)';
            e.target.style.boxShadow = 'none';
          }}
        />
        {!search && (
          <kbd
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              fontSize: '11px',
              lineHeight: 1,
              padding: '2px 4px',
              borderRadius: '3px',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              fontFamily: 'inherit',
            }}
          >
            {searchShortcut}
          </kbd>
        )}
      </div>

      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
          {tags.map((tag) => {
            const active = selectedTagIds.includes(tag.id);
              return (
              <button
                key={tag.id}
                onClick={() => onTagSelect(tag.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: active ? `1px solid ${tag.color}` : '1px solid var(--border)',
                  backgroundColor: active ? `${tag.color}22` : 'var(--surface-hover)',
                  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                  transition: 'all 150ms',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: tag.color,
                    flexShrink: 0,
                  }}
                />
                {tag.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
