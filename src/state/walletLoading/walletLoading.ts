import { type WalletLoadingStates } from '@/helpers/walletLoadingStates';

import { createRainbowStore } from '../internal/createRainbowStore';

type WalletLoadingState = {
  loadingState: WalletLoadingStates | null;
};

export const walletLoadingStore = createRainbowStore<WalletLoadingState>(() => ({
  loadingState: null,
}));
