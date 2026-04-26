import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Command } from 'cmdk';
import type { Item } from '@queuepilot/core/types';
import { useApi } from '../../hooks/useApi';
import { cn } from '../../lib/utils';
import { useUiStore } from '../../store/ui.store';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface StaticCommand {
  id: string;
  label: string;
  onSelect: () => void;
}

export function CommandPalette({ open, onClose }: Props) {
  const [query, setQuery] = useState('');
  const { setFilterState, setAddDialogOpen, setSelectedItemId } = useUiStore();
  const api = useApi();

  const { data: itemResults } = useQuery({
    queryKey: ['items', { q: query }],
    queryFn: async () => {
      const res = await api.items.list({ q: query });
      return res.data as Item[];
    },
    enabled: query.length >= 2,
    staleTime: 1000 * 15,
  });

  const navigationCommands = useMemo<StaticCommand[]>(
    () => [
      {
        id: 'nav-inbox',
        label: 'Go to Inbox',
        onSelect: () => {
          setFilterState({ status: 'inbox' });
          onClose();
        },
      },
      {
        id: 'nav-in-progress',
        label: 'Go to In Progress',
        onSelect: () => {
          setFilterState({ status: 'in_progress' });
          onClose();
        },
      },
      {
        id: 'nav-done',
        label: 'Go to Done',
        onSelect: () => {
          setFilterState({ status: 'done' });
          onClose();
        },
      },
    ],
    [setFilterState, onClose],
  );

  const actionCommands = useMemo<StaticCommand[]>(
    () => [
      {
        id: 'action-create',
        label: 'Create new item',
        onSelect: () => {
          setAddDialogOpen(true);
          onClose();
        },
      },
      {
        id: 'action-clear-filters',
        label: 'Clear filters',
        onSelect: () => {
          setFilterState({});
          onClose();
        },
      },
    ],
    [setAddDialogOpen, setFilterState, onClose],
  );

  const queryLower = query.toLowerCase();

  const visibleNavigation = query
    ? navigationCommands.filter((cmd) => cmd.label.toLowerCase().includes(queryLower))
    : navigationCommands;

  const visibleActions = query
    ? actionCommands.filter((cmd) => cmd.label.toLowerCase().includes(queryLower))
    : actionCommands;

  const visibleItems = query.length >= 2 ? (itemResults ?? []).slice(0, 8) : [];

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const hasResults =
    visibleNavigation.length > 0 || visibleActions.length > 0 || visibleItems.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[15vh]"
      onClick={onClose}
    >
      <div
        className={cn(
          'w-full max-w-lg rounded-xl border border-border bg-background shadow-2xl',
          'flex flex-col overflow-hidden',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <Command shouldFilter={false} className="flex flex-col">
          <div className="border-b border-border px-3">
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search commands and items…"
              autoFocus
              className={cn(
                'w-full bg-transparent py-3 text-sm text-foreground outline-none',
                'placeholder:text-muted-foreground',
              )}
            />
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            {!hasResults && (
              <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
                No results found.
              </Command.Empty>
            )}

            {visibleNavigation.length > 0 && (
              <Command.Group
                heading="Navigation"
                className={cn(
                  '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5',
                  '[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium',
                  '[&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider',
                  '[&_[cmdk-group-heading]]:text-muted-foreground',
                )}
              >
                {visibleNavigation.map((cmd) => (
                  <Command.Item
                    key={cmd.id}
                    value={cmd.id}
                    onSelect={cmd.onSelect}
                    className={cn(
                      'flex cursor-pointer select-none items-center rounded-lg px-3 py-2',
                      'text-sm text-foreground transition-colors',
                      'aria-selected:bg-accent aria-selected:text-accent-foreground',
                      'hover:bg-accent hover:text-accent-foreground',
                    )}
                  >
                    {cmd.label}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {visibleActions.length > 0 && (
              <Command.Group
                heading="Actions"
                className={cn(
                  '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5',
                  '[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium',
                  '[&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider',
                  '[&_[cmdk-group-heading]]:text-muted-foreground',
                )}
              >
                {visibleActions.map((cmd) => (
                  <Command.Item
                    key={cmd.id}
                    value={cmd.id}
                    onSelect={cmd.onSelect}
                    className={cn(
                      'flex cursor-pointer select-none items-center rounded-lg px-3 py-2',
                      'text-sm text-foreground transition-colors',
                      'aria-selected:bg-accent aria-selected:text-accent-foreground',
                      'hover:bg-accent hover:text-accent-foreground',
                    )}
                  >
                    {cmd.label}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {visibleItems.length > 0 && (
              <Command.Group
                heading="Items"
                className={cn(
                  '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5',
                  '[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium',
                  '[&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider',
                  '[&_[cmdk-group-heading]]:text-muted-foreground',
                )}
              >
                {visibleItems.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={item.id}
                    onSelect={() => {
                      setSelectedItemId(item.id);
                      onClose();
                    }}
                    className={cn(
                      'flex cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2',
                      'text-sm text-foreground transition-colors',
                      'aria-selected:bg-accent aria-selected:text-accent-foreground',
                      'hover:bg-accent hover:text-accent-foreground',
                    )}
                  >
                    <span
                      className={cn(
                        'shrink-0 rounded px-1.5 py-0.5 text-xs',
                        'bg-muted text-muted-foreground',
                      )}
                    >
                      {item.status}
                    </span>
                    <span className="truncate">{item.title}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>

        <div className="flex items-center gap-4 border-t border-border px-4 py-2">
          <span className="text-xs text-muted-foreground">
            <kbd className="font-mono">↑↓</kbd> navigate
          </span>
          <span className="text-xs text-muted-foreground">
            <kbd className="font-mono">↵</kbd> select
          </span>
          <span className="text-xs text-muted-foreground">
            <kbd className="font-mono">esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
