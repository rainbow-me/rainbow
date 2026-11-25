import { createBaseStore, createDerivedStore, createStoreActions } from '@storesjs/stores';

import { useWalletsStore } from '@/state/wallets/walletsStore';

export type BooleanMap = Record<string, boolean>;

type PinnedCoinsState = {
  pinnedCoins: { [address: string]: BooleanMap };
  isPinned: (uniqueId: string) => boolean;
  setPinnedCoins: (uniqueIds: readonly string[], pinned: boolean) => void;
};

export const usePinnedCoinsStore = createBaseStore<PinnedCoinsState>(
  (set, get) => ({
    pinnedCoins: {},

    isPinned: uniqueId => {
      const accountAddress = useWalletsStore.getState().accountAddress;
      return get().pinnedCoins[accountAddress]?.[uniqueId.toLowerCase()] ?? false;
    },

    setPinnedCoins: (uniqueIds, pinned) => {
      const address = useWalletsStore.getState().accountAddress;

      set(state => {
        const pins = { ...state.pinnedCoins[address] };
        for (const uniqueId of uniqueIds) {
          const id = uniqueId.toLowerCase();
          if (pinned) pins[id] = true;
          else delete pins[id];
        }

        return { pinnedCoins: { ...state.pinnedCoins, [address]: pins } };
      });
    },
  }),

  { storageKey: 'pinnedCoinsStore' }
);

export const pinnedCoinsActions = createStoreActions(usePinnedCoinsStore);

const EMPTY_BOOLEAN_MAP: BooleanMap = {};

export const useCurrentPinnedCoins = createDerivedStore(
  $ => {
    const accountAddress = $(useWalletsStore, s => s.accountAddress);
    const pinnedCoins = $(usePinnedCoinsStore, s => s.pinnedCoins);
    return pinnedCoins[accountAddress] ?? EMPTY_BOOLEAN_MAP;
  },
  { lockDependencies: true }
);
