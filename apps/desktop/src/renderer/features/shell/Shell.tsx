import { useCallback, useEffect, useRef, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '../../components/ui/tooltip'
import { AddItemDialog } from '../items/AddItemDialog'
import { ItemDetail } from './ItemDetail'
import { ItemList } from './ItemList'
import { CycleBoard } from '../items/CycleBoard'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'
import { Header } from './Header'
import { ShortcutsOverlay } from './ShortcutsOverlay'
import { useUiStore } from '../../store/ui.store'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 10,
      refetchOnWindowFocus: true,
      refetchInterval: 10000,
    },
  },
})

const SIDEBAR_ICON = 48;

function useWindowWidth() {
  const [width, setWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

function ShellContent() {
  const {
    selectedItemId,
    shortcutsOpen,
    setShortcutsOpen,
    setSelectedItemId,
    sidebarCollapsed,
    setSidebarCollapsed,
    sidebarWidth: storeSidebarWidth,
    setSidebarWidth,
    detailPanelWidth,
    setDetailPanelWidth,
    addDialogOpen,
    setAddDialogOpen,
    filterState,
  } = useUiStore();

  const windowWidth = useWindowWidth();
  const isNarrow = windowWidth < 640;
  const isMedium = windowWidth >= 640 && windowWidth < 1024;
  const isWide = windowWidth >= 1024;

  // Auto-collapse sidebar on medium screens, hide on narrow
  const effectiveCollapsed = isNarrow || isMedium ? true : sidebarCollapsed;
  const sidebarWidth = isNarrow ? 0 : (effectiveCollapsed ? SIDEBAR_ICON : storeSidebarWidth);

  // Drag resize state for the sidebar
  const isSidebarDragging = useRef(false);
  const sidebarDragStartX = useRef(0);
  const sidebarDragStartWidth = useRef(0);
  const [isSidebarResizing, setIsSidebarResizing] = useState(false);

  const handleSidebarDragStart = useCallback((e: React.MouseEvent) => {
    isSidebarDragging.current = true;
    sidebarDragStartX.current = e.clientX;
    sidebarDragStartWidth.current = storeSidebarWidth;
    setIsSidebarResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = (e: MouseEvent) => {
      if (!isSidebarDragging.current) return;
      const newWidth = Math.min(400, Math.max(160, sidebarDragStartWidth.current + (e.clientX - sidebarDragStartX.current)));
      setSidebarWidth(newWidth);
    };

    const onUp = () => {
      isSidebarDragging.current = false;
      setIsSidebarResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [storeSidebarWidth, setSidebarWidth]);

  // Drag resize state for the detail panel
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartWidth.current = detailPanelWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = dragStartX.current - e.clientX;
      const newWidth = Math.min(520, Math.max(280, dragStartWidth.current + delta));
      setDetailPanelWidth(newWidth);
    };

    const onUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [detailPanelWidth, setDetailPanelWidth]);

  const showDetailOverlay = !!selectedItemId && !isWide;
  const showDetailPanel = !!selectedItemId && isWide;

  return (
    <>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Sidebar — hidden on narrow, icon strip on medium, full on wide */}
        {!isNarrow && (
          <div style={{ display: 'flex', flexShrink: 0, height: '100%' }}>
            <div
              style={{
                width: `${sidebarWidth}px`,
                overflowY: 'auto',
                overflowX: 'hidden',
                backgroundColor: 'var(--bg-primary)',
                borderRight: (!isWide || effectiveCollapsed) ? '1px solid var(--border)' : undefined,
                transition: isSidebarResizing ? 'none' : 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <Sidebar
                collapsed={effectiveCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
              />
            </div>
            {/* Drag handle at right edge — only on wide screens when not collapsed */}
            {isWide && !effectiveCollapsed && (
              <div
                onMouseDown={handleSidebarDragStart}
                style={{
                  width: '4px',
                  cursor: 'col-resize',
                  flexShrink: 0,
                  backgroundColor: 'transparent',
                  borderRight: '1px solid var(--border)',
                  transition: 'background-color 150ms',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  if (!isSidebarDragging.current)
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                }}
              />
            )}
          </div>
        )}

        {/* Item list — fills remaining space */}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            borderRight: showDetailPanel ? '1px solid var(--border)' : undefined,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--bg-secondary)',
            overflow: 'hidden',
          }}
        >
          {filterState.cycle_id ? (
              <CycleBoard cycleId={filterState.cycle_id} />
            ) : (
              <ItemList />
            )}
        </main>

        {/* Detail panel — inline on wide screens, drag-resizable */}
        {showDetailPanel && (
          <div style={{ display: 'flex', flexShrink: 0, height: '100%' }}>
            {/* Drag handle — grab left edge to resize */}
            <div
              onMouseDown={handleDragStart}
              style={{
                width: '4px',
                cursor: 'col-resize',
                flexShrink: 0,
                backgroundColor: 'transparent',
                transition: 'background-color 150ms',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--accent)';
              }}
              onMouseLeave={(e) => {
                if (!isDragging.current)
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
              }}
            />
            <div
              style={{
                width: `${detailPanelWidth}px`,
                height: '100%',
                overflowY: 'auto',
                backgroundColor: 'var(--bg-primary)',
              }}
            >
              <ItemDetail />
            </div>
          </div>
        )}

        {/* Detail overlay — slides in on medium/narrow when item selected */}
        {showDetailOverlay && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: isNarrow ? '100%' : '380px',
              backgroundColor: 'var(--bg-primary)',
              borderLeft: '1px solid var(--border)',
              overflowY: 'auto',
              zIndex: 20,
              boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.25)',
            }}
          >
            <button
              onClick={() => setSelectedItemId(null)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                border: '1px solid var(--border)',
                backgroundColor: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '14px',
                zIndex: 1,
              }}
              title="Close (Escape)"
            >
              ×
            </button>
            <ItemDetail />
          </div>
        )}
      </div>
      <ShortcutsOverlay open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <AddItemDialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} />
    </>
  );
}

export function Shell() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div
          className="flex flex-col h-screen select-none"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          <Header />
          <ShellContent />
          <StatusBar />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  )
}
