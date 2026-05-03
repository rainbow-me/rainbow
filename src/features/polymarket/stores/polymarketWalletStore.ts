import { type Address } from 'viem';

import { createRainbowStore } from '@/state/internal/createRainbowStore';

export type PolymarketWalletKind = 'safe' | 'depositWallet';

type PolymarketWalletStoreState = {
  walletKindsByOwner: Record<string, PolymarketWalletKind>;
  getWalletKind: (ownerAddress: Address) => PolymarketWalletKind | undefined;
  setWalletKind: (ownerAddress: Address, walletKind: PolymarketWalletKind) => void;
};

export const usePolymarketWalletStore = createRainbowStore<PolymarketWalletStoreState>(
  (set, get) => ({
    walletKindsByOwner: {},

    getWalletKind: ownerAddress => {
      return get().walletKindsByOwner[ownerAddress.toLowerCase()];
    },

    setWalletKind: (ownerAddress, walletKind) => {
      set(state => ({
        walletKindsByOwner: {
          ...state.walletKindsByOwner,
          [ownerAddress.toLowerCase()]: walletKind,
        },
      }));
    },
  }),
  { storageKey: 'polymarketWalletStore' }
);
