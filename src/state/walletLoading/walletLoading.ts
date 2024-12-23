import { createRainbowStore } from '../internal/createRainbowStore';
import { WalletLoadingStates } from '@/helpers/walletLoadingStates';

type WalletLoadingState = {
  loadingState: WalletLoadingStates | null;
  blockTouches: boolean;
  Component: JSX.Element | null;
  hide: () => void;
  setComponent: (Component: JSX.Element, blockTouches?: boolean) => void;
};

export const walletLoadingStore = createRainbowStore<WalletLoadingState>(set => ({
  loadingState: null,
  blockTouches: false,
  Component: null,
  hide: () => set({ blockTouches: false, Component: null }),
  setComponent: (Component: JSX.Element, blockTouches = true) => set({ blockTouches, Component }),
}));
