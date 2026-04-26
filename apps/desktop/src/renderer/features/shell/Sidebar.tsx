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
    <div className="flex flex-col h-full bg-background border-r border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">QueuePilot</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAddDialogOpen(true)}
          className="h-6 w-6 p-0"
          title="New item (C)"
        >
          <Plus size={14} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
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
    <div className="mb-1">
      <div className="flex items-center gap-1 px-4 py-1">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Plus size={12} className="ml-auto text-muted-foreground hover:text-foreground cursor-pointer" />
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
      className={cn(
        'w-full flex items-center gap-2 px-4 py-1.5 text-sm text-left transition-colors',
        active
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}
