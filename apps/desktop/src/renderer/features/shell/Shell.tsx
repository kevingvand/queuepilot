import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { TooltipProvider } from '../../components/ui/tooltip';
import { AddItemDialog } from '../items/AddItemDialog';
import { useUiStore } from '../../store/ui.store';
import { CommandPalette } from './CommandPalette';
import { ItemDetail } from './ItemDetail';
import { ItemList } from './ItemList';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 30 } },
});

function ShellContent() {
  const { addDialogOpen, setAddDialogOpen } = useUiStore();
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdPaletteOpen(true);
        return;
      }

      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable
      ) {
        return;
      }
      if (e.key === 'c' || e.key === 'C') {
        setAddDialogOpen(true);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setAddDialogOpen]);

  return (
    <>
      <div className="flex flex-col h-screen bg-background text-foreground select-none">
        <Group orientation="horizontal" className="flex-1 overflow-hidden">
          <Panel defaultSize={20} minSize={15} maxSize={30}>
            <Sidebar />
          </Panel>
          <Separator className="w-px bg-border hover:bg-primary/40 transition-colors" />
          <Panel defaultSize={45} minSize={30}>
            <ItemList />
          </Panel>
          <Separator className="w-px bg-border hover:bg-primary/40 transition-colors" />
          <Panel defaultSize={35} minSize={25}>
            <ItemDetail />
          </Panel>
        </Group>
        <StatusBar />
      </div>
      <AddItemDialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} />
      <CommandPalette open={cmdPaletteOpen} onClose={() => setCmdPaletteOpen(false)} />
    </>
  );
}

export function Shell() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ShellContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
