import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  CircleDot,
  Inbox,
  Plus,
  Tag,
} from 'lucide-react';
import type { Tag as TagType } from '@queuepilot/core/types';
import { Button } from '../../components/ui/button';
import { useApi } from '../../hooks/useApi';
import { cn } from '../../lib/utils';
import { type FilterState, useUiStore } from '../../store/ui.store';
import { CyclesList } from '../items/CyclesList';
import { SavedFiltersList } from '../items/SavedFiltersList';

type NavItem = {
  label: string;
  icon: React.ReactNode;
  filter: FilterState;
};

const INBOX_ITEMS: NavItem[] = [
  { label: 'All Items', icon: <Inbox size={14} />, filter: {} },
  { label: 'Inbox', icon: <Inbox size={14} />, filter: { status: 'inbox' } },
  { label: 'In Progress', icon: <CircleDot size={14} />, filter: { status: 'in_progress' } },
  { label: 'Done', icon: <CheckCircle2 size={14} />, filter: { status: 'done' } },
];

export function Sidebar() {
  const { filterState, setFilterState, setAddDialogOpen } = useUiStore();
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
    <div className="flex flex-col h-full overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', borderRightColor: 'var(--border)', borderRightWidth: '1px' }}>
      <div className="px-3 py-3 flex items-center justify-between" style={{ borderBottomColor: 'var(--border)', borderBottomWidth: '1px' }}>
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Filters
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAddDialogOpen(true)}
          className="h-6 w-6 p-0"
          title="New item (C)"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Plus size={14} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ padding: '8px 0' }}>
        <SidebarSection label="Inbox">
          {INBOX_ITEMS.map((item) => (
            <NavRow
              key={item.label}
              icon={item.icon}
              label={item.label}
              active={isActive(item.filter)}
              onClick={() => setFilterState(item.filter)}
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
              onClick={() => setFilterState({ tag: t.id })}
            />
          ))}
        </SidebarSection>
      </div>
    </div>
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
    <div style={{ marginBottom: '24px' }}>
      <div className="flex items-center gap-2 px-3 py-2">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {label}
        </span>
        <Plus size={12} className="ml-auto cursor-pointer" style={{ color: 'var(--text-muted)' }} />
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
      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors"
      style={{
        backgroundColor: active ? 'var(--accent)' : 'transparent',
        color: active ? '#ffffff' : 'var(--text-secondary)',
        marginBottom: '4px',
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
