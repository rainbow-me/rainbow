import { create } from 'zustand';
import { Address } from 'viem';

export interface WcAuthState {
  address: Address | undefined;
  initialize: (address: Address | undefined) => void;
  setAddress: (address: Address) => void;
  clearAddress: () => void; // Good practice to clear state when done
}

export const useWcAuthStore = create<WcAuthState>(set => ({
  address: undefined,
  initialize: address => set({ address }),
  setAddress: address => set({ address }),
  clearAddress: () => set({ address: undefined }),
}));
