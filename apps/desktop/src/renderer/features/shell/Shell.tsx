import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { TooltipProvider } from '../../components/ui/tooltip';
import { ItemDetail } from './ItemDetail';
import { ItemList } from './ItemList';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 30 } },
});

export function Shell() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
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
      </TooltipProvider>
    </QueryClientProvider>
  );
}
