import { createBaseStore } from '@storesjs/stores';

import { type WalletLoadingStates } from '@/helpers/walletLoadingStates';

type WalletLoadingState = {
  loadingState: WalletLoadingStates | null;
};

export const walletLoadingStore = createBaseStore<WalletLoadingState>(() => ({
  loadingState: null,
}));
