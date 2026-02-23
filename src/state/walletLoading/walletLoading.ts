import { createRainbowStore } from '../internal/createRainbowStore';
import { type WalletLoadingStates } from '@/helpers/walletLoadingStates';

type WalletLoadingState = {
  loadingState: WalletLoadingStates | null;
};

export const walletLoadingStore = createRainbowStore<WalletLoadingState>(() => ({
  loadingState: null,
}));
