import { create } from 'zustand';
import type { ThemeMode } from '../../types/app';

interface ThemeState {
  mode: ThemeMode;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'business',
  toggle: () => set((s) => ({ mode: s.mode === 'business' ? 'tech' : 'business' })),
  setMode: (mode) => set({ mode }),
}));
