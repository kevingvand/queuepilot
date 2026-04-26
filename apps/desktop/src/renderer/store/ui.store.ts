import { create } from 'zustand';

export type FilterState = {
  status?: string;
  tag?: string;
  cycle_id?: string;
  q?: string;
};

export type SortOrder = 'newest' | 'oldest' | 'priority' | 'title';

type UiStore = {
  selectedItemId: string | null;
  filterState: FilterState;
  sortOrder: SortOrder;
  addDialogOpen: boolean;
  setSelectedItemId: (id: string | null) => void;
  setFilterState: (filter: FilterState) => void;
  setSortOrder: (order: SortOrder) => void;
  setAddDialogOpen: (open: boolean) => void;
};

export const useUiStore = create<UiStore>((set) => ({
  selectedItemId: null,
  filterState: {},
  sortOrder: 'newest',
  addDialogOpen: false,
  setSelectedItemId: (id) => set({ selectedItemId: id }),
  setFilterState: (filter) => set({ filterState: filter }),
  setSortOrder: (order) => set({ sortOrder: order }),
  setAddDialogOpen: (open) => set({ addDialogOpen: open }),
}));
