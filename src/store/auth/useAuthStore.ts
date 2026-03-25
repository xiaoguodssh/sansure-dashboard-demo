import { create } from 'zustand';
import type { UserRole } from '../../types/app';

interface AuthState {
  isLoggedIn: boolean;
  role: UserRole;
  login: (role: UserRole) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  role: 'chairman',
  login: (role) => set({ isLoggedIn: true, role }),
  logout: () => set({ isLoggedIn: false, role: 'chairman' }),
}));
