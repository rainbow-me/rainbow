import { createRainbowStore } from '../internal/createRainbowStore';
import { WalletLoadingStates } from '@/helpers/walletLoadingStates';

type WalletLoadingState = {
  loadingState: WalletLoadingStates | null;
  show: (state: WalletLoadingStates) => void;
  hide: () => void;
};

export const walletLoadingStore = createRainbowStore<WalletLoadingState>(set => ({
  loadingState: null,
  show: (loadingState: WalletLoadingStates) => set({ loadingState }),
  hide: () => set({ loadingState: null }),
}));
