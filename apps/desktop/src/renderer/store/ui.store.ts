import { create } from 'zustand';

export type FilterState = {
  status?: string;
  tag?: string;
  cycle_id?: string;
  q?: string;
};

type UiStore = {
  selectedItemId: string | null;
  filterState: FilterState;
  setSelectedItemId: (id: string | null) => void;
  setFilterState: (filter: FilterState) => void;
};

export const useUiStore = create<UiStore>((set) => ({
  selectedItemId: null,
  filterState: {},
  setSelectedItemId: (id) => set({ selectedItemId: id }),
  setFilterState: (filter) => set({ filterState: filter }),
}));
