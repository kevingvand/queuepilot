import { create } from 'zustand';

export type FilterState = {
  status?: string;
  tag?: string;
  cycle_id?: string;
  q?: string;
};

export type SortOrder = 'newest' | 'oldest' | 'priority' | 'title';

const DETAIL_WIDTH_KEY = 'qp:detailPanelWidth';
const SIDEBAR_WIDTH_KEY = 'qp:sidebarWidth';

function getStoredSidebarWidth(): number {
  try {
    const stored = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    if (stored) return Math.min(400, Math.max(160, Number(stored)));
  } catch {}
  return 240;
}

function getStoredDetailWidth(): number {
  try {
    const stored = localStorage.getItem(DETAIL_WIDTH_KEY);
    if (stored) return Math.min(520, Math.max(280, Number(stored)));
  } catch {}
  return 380;
}

type UiStore = {
  selectedItemId: string | null;
  filterState: FilterState;
  sortOrder: SortOrder;
  addDialogOpen: boolean;
  shortcutsOpen: boolean;
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  detailPanelWidth: number;
  focusDetailTitle: boolean;
  setSelectedItemId: (id: string | null) => void;
  setFilterState: (filter: FilterState) => void;
  setSortOrder: (order: SortOrder) => void;
  setAddDialogOpen: (open: boolean) => void;
  setShortcutsOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (w: number) => void;
  setDetailPanelWidth: (width: number) => void;
  triggerFocusDetailTitle: () => void;
  clearFocusDetailTitle: () => void;
};

export const useUiStore = create<UiStore>((set) => ({
  selectedItemId: null,
  filterState: { status: 'inbox' as string },
  sortOrder: 'newest',
  addDialogOpen: false,
  shortcutsOpen: false,
  sidebarCollapsed: false,
  sidebarWidth: getStoredSidebarWidth(),
  detailPanelWidth: getStoredDetailWidth(),
  focusDetailTitle: false,
  setSelectedItemId: (id) => set({ selectedItemId: id }),
  setFilterState: (filter) => set({ filterState: filter }),
  setSortOrder: (order) => set({ sortOrder: order }),
  setAddDialogOpen: (open) => set({ addDialogOpen: open }),
  setShortcutsOpen: (open) => set({ shortcutsOpen: open }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setSidebarWidth: (w) => {
    try { localStorage.setItem(SIDEBAR_WIDTH_KEY, String(w)); } catch {}
    set({ sidebarWidth: w });
  },
  setDetailPanelWidth: (width) => {
    try { localStorage.setItem(DETAIL_WIDTH_KEY, String(width)); } catch {}
    set({ detailPanelWidth: width });
  },
  triggerFocusDetailTitle: () => set({ focusDetailTitle: true }),
  clearFocusDetailTitle: () => set({ focusDetailTitle: false }),
}));
