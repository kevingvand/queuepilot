import { create } from 'zustand';

export type FilterState = {
  status?: string;
  tag?: string;
  cycle_id?: string;
  q?: string;
};

export type SortOrder = 'newest' | 'oldest' | 'priority' | 'title';

const DETAIL_WIDTH_KEY = 'qp:detailPanelWidth';

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
  detailPanelWidth: number;
  setSelectedItemId: (id: string | null) => void;
  setFilterState: (filter: FilterState) => void;
  setSortOrder: (order: SortOrder) => void;
  setAddDialogOpen: (open: boolean) => void;
  setShortcutsOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setDetailPanelWidth: (width: number) => void;
};

export const useUiStore = create<UiStore>((set) => ({
  selectedItemId: null,
  filterState: {},
  sortOrder: 'newest',
  addDialogOpen: false,
  shortcutsOpen: false,
  sidebarCollapsed: false,
  detailPanelWidth: getStoredDetailWidth(),
  setSelectedItemId: (id) => set({ selectedItemId: id }),
  setFilterState: (filter) => set({ filterState: filter }),
  setSortOrder: (order) => set({ sortOrder: order }),
  setAddDialogOpen: (open) => set({ addDialogOpen: open }),
  setShortcutsOpen: (open) => set({ shortcutsOpen: open }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setDetailPanelWidth: (width) => {
    try { localStorage.setItem(DETAIL_WIDTH_KEY, String(width)); } catch {}
    set({ detailPanelWidth: width });
  },
}));
