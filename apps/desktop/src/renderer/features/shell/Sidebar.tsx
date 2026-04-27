import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Inbox,
  Tag,
} from 'lucide-react';
import type { Tag as TagType } from '@queuepilot/core/types';
import { useApi } from '../../hooks/useApi';
import { cn } from '../../lib/utils';
import { type FilterState, useUiStore } from '../../store/ui.store';
import { CyclesList } from '../cycles/CyclesList';
import { SavedFiltersList } from '../items/SavedFiltersList';

type NavItem = {
  label: string;
  icon: React.ReactNode;
  filter: FilterState;
};

const INBOX_ITEMS: NavItem[] = [
  { label: 'Inbox', icon: <Inbox size={14} />, filter: { status: 'inbox' } },
  { label: 'In Progress', icon: <CircleDot size={14} />, filter: { status: 'in_progress' } },
  { label: 'Done', icon: <CheckCircle2 size={14} />, filter: { status: 'done' } },
  { label: 'All Items', icon: <Inbox size={14} />, filter: {} },
];

type SidebarProps = {
  collapsed: boolean;
  onToggleCollapse: () => void;
};

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const { filterState, setFilterState, setActiveCycleId } = useUiStore();
  const api = useApi();

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const res = await api.tags.list();
      return res.data as TagType[];
    },
  });

  const isActive = (filter: FilterState) =>
    JSON.stringify(filterState) === JSON.stringify(filter);

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Nav items */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '8px 0' }}>
        {collapsed ? (
          /* Icon strip when collapsed */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '4px' }}>
            {INBOX_ITEMS.map((item) => (
              <IconNavButton
                key={item.label}
                icon={item.icon}
                label={item.label}
                active={isActive(item.filter)}
                onClick={() => { setFilterState(item.filter); setActiveCycleId(null); }}
              />
            ))}
          </div>
        ) : (
          <>
            <SidebarSection label="Navigation">
              {INBOX_ITEMS.map((item) => (
                <NavRow
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  active={isActive(item.filter)}
                  onClick={() => { setFilterState(item.filter); setActiveCycleId(null); }}
                />
              ))}
            </SidebarSection>

            <SavedFiltersList />

            <CyclesList />

            <SidebarSection label="Tags" icon={<Tag size={12} />}>
              {tagsData?.map((t) => (
                <NavRow
                  key={t.id}
                  icon={
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: t.color }}
                    />
                  }
                  label={t.name}
                  active={isActive({ tag: t.id })}
                  onClick={() => { setFilterState({ tag: t.id }); setActiveCycleId(null); }}
                />
              ))}
            </SidebarSection>
          </>
        )}
      </div>

      {/* Collapse toggle at the bottom */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '4px' }}>
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'w-full flex items-center justify-center rounded transition-colors',
            collapsed ? 'py-2' : 'py-1.5 px-2 gap-2',
          )}
          style={{ color: 'var(--text-muted)', backgroundColor: 'transparent' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--surface-hover)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
          }}
        >
          {collapsed ? <ChevronRight size={14} /> : (
            <>
              <ChevronLeft size={14} />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function IconNavButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="flex items-center justify-center rounded transition-colors"
      style={{
        width: '36px',
        height: '36px',
        backgroundColor: active ? 'var(--accent)' : 'transparent',
        color: active ? '#ffffff' : 'var(--text-muted)',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--surface-hover)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
        }
      }}
    >
      {icon}
    </button>
  );
}

function SidebarSection({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div className="flex items-center gap-2 px-3 py-1">
        {icon}
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

function NavRow({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left rounded mx-1 transition-colors"
      style={{
        width: 'calc(100% - 8px)',
        backgroundColor: active ? 'var(--accent)' : 'transparent',
        color: active ? '#ffffff' : 'var(--text-secondary)',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--surface-hover)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
        }
      }}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}
