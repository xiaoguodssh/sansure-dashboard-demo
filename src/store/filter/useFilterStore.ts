import { create } from 'zustand';
import type { GlobalFilterState } from '../../types/app';

interface FilterState extends GlobalFilterState {
  update: (patch: Partial<GlobalFilterState>) => void;
  reset: () => void;
}

const initialState: GlobalFilterState = {
  dateRange: ['2024-01-01', new Date().toISOString().slice(0, 10)],
  caliber: 'combined',
  orgLevel: 'group',
  marketScope: 'all',
  businessView: 'default',
};

export const useFilterStore = create<FilterState>((set) => ({
  ...initialState,
  update: (patch) => set((state) => ({ ...state, ...patch })),
  reset: () => set(initialState),
}));
