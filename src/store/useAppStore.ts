import { create } from 'zustand';

interface AppState {
  userType: 'studio' | 'pro';
  setUserType: (type: 'studio' | 'pro') => void;
}

export const useAppStore = create<AppState>((set) => ({
  userType: 'pro',
  setUserType: (type) => set({ userType: type }),
}));
