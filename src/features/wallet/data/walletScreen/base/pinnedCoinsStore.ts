import { createBaseStore, createDerivedStore, createStoreActions } from '@storesjs/stores';
import { createMMKV } from 'react-native-mmkv';

import { useWalletsStore } from '@/state/wallets/walletsStore';

export type BooleanMap = Record<string, boolean>;

type PinnedCoinsState = {
  pinnedCoins: { [address: string]: BooleanMap };
  isPinned: (uniqueId: string) => boolean;
  setPinnedCoin: (uniqueId: string, pinned: boolean) => void;
  setPinnedCoins: (pinnedCoins: BooleanMap) => void;
};

export const usePinnedCoinsStore = createBaseStore<PinnedCoinsState>(
  (set, get) => ({
    pinnedCoins: readPinnedCoins(),

    isPinned: uniqueId => {
      const accountAddress = useWalletsStore.getState().accountAddress;
      return get().pinnedCoins[accountAddress]?.[uniqueId.toLowerCase()] ?? false;
    },

    setPinnedCoin: (uniqueId, pinned) => {
      const accountAddress = useWalletsStore.getState().accountAddress;
      set(state => {
        const newPinnedCoins = { ...state.pinnedCoins };
        if (pinned) {
          newPinnedCoins[accountAddress] = {
            ...newPinnedCoins[accountAddress],
            [uniqueId.toLowerCase()]: true,
          };
        } else {
          const currentAccountPins = { ...newPinnedCoins[accountAddress] };
          delete currentAccountPins[uniqueId.toLowerCase()];
          newPinnedCoins[accountAddress] = currentAccountPins;
        }

        return { pinnedCoins: newPinnedCoins };
      });
    },

    setPinnedCoins: pinnedCoins => {
      const address = useWalletsStore.getState().accountAddress;
      set(state => {
        const newPinnedCoins = { ...state.pinnedCoins };
        // Normalize all keys to lowercase for consistency with setPinnedCoin and isPinned
        const normalizedPinnedCoins: BooleanMap = {};
        for (const uniqueId in pinnedCoins) {
          if (pinnedCoins[uniqueId]) {
            normalizedPinnedCoins[uniqueId.toLowerCase()] = true;
          }
        }
        newPinnedCoins[address] = normalizedPinnedCoins;
        return { pinnedCoins: newPinnedCoins };
      });
    },
  }),

  { storageKey: 'pinnedCoinsStore' }
);

export const pinnedCoinsActions = createStoreActions(usePinnedCoinsStore);

const EMPTY_BOOLEAN_MAP: BooleanMap = {};

export const useCurrentPinnedCoins = createDerivedStore($ => {
  const accountAddress = $(useWalletsStore, state => state.accountAddress);
  const pinnedCoins = $(usePinnedCoinsStore, state => state.pinnedCoins[accountAddress]);
  return pinnedCoins || EMPTY_BOOLEAN_MAP;
});

function readPinnedCoins(): Record<string, BooleanMap> {
  const storage = createMMKV();
  const pinnedCoins: Record<string, BooleanMap> = {};
  for (const key of storage.getAllKeys()) {
    if (!key.startsWith('pinned-coins-obj-')) continue;
    const value = storage.getString(key);
    if (value) pinnedCoins[key.slice('pinned-coins-obj-'.length)] = JSON.parse(value);
  }
  return pinnedCoins;
}
