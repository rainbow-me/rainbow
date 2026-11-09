import { createBaseStore, createDerivedStore, createStoreActions } from '@storesjs/stores';
import { createMMKV } from 'react-native-mmkv';

import { useWalletsStore } from '@/state/wallets/walletsStore';

export type ListSectionKey = 'smallBalances' | 'positions' | 'claimables' | 'predictions';
export type ListSectionToggles = Record<ListSectionKey, boolean>;

const DEFAULT_TOGGLES: ListSectionToggles = {
  claimables: false,
  positions: false,
  predictions: false,
  smallBalances: false,
};

type ListSectionTogglesState = {
  togglesByWallet: Partial<Record<string, ListSectionToggles>>;
  getCurrentToggles: (accountAddress?: string) => ListSectionToggles;
  setToggle: (section: ListSectionKey, value: boolean) => void;
  toggle: (section: ListSectionKey) => void;
};

const useWalletListTogglesStore = createBaseStore<ListSectionTogglesState>(
  (set, get) => ({
    togglesByWallet: readListToggles(),

    getCurrentToggles: accountAddress => {
      const address = accountAddress ?? useWalletsStore.getState().accountAddress;
      return get().togglesByWallet[address] ?? DEFAULT_TOGGLES;
    },

    setToggle: (section, value) => {
      const accountAddress = useWalletsStore.getState().accountAddress;
      if (!accountAddress) return;

      set(state => {
        const currentToggles = state.togglesByWallet[accountAddress];
        if (currentToggles && currentToggles[section] === value) return state;
        return {
          togglesByWallet: {
            ...state.togglesByWallet,
            [accountAddress]: {
              ...(currentToggles ?? DEFAULT_TOGGLES),
              [section]: value,
            },
          },
        };
      });
    },

    toggle: section => {
      const accountAddress = useWalletsStore.getState().accountAddress;
      if (!accountAddress) return;

      set(state => {
        const currentToggles = state.togglesByWallet[accountAddress] ?? DEFAULT_TOGGLES;
        return {
          togglesByWallet: {
            ...state.togglesByWallet,
            [accountAddress]: {
              ...currentToggles,
              [section]: !currentToggles[section],
            },
          },
        };
      });
    },
  }),

  { storageKey: 'listSectionTogglesStore' }
);

export const useCurrentWalletToggles = createDerivedStore($ => {
  const accountAddress = $(useWalletsStore, state => state.accountAddress);
  const togglesByWallet = $(useWalletListTogglesStore, state => state.togglesByWallet);

  if (!accountAddress) return DEFAULT_TOGGLES;

  return togglesByWallet[accountAddress] ?? DEFAULT_TOGGLES;
});

export const walletListTogglesActions = createStoreActions(useWalletListTogglesStore);

function readListToggles(): Partial<Record<string, ListSectionToggles>> {
  const storage = createMMKV();
  const toggles: Partial<Record<string, ListSectionToggles>> = {};
  const sections = { 'claimables-open-': 'claimables', 'positions-open-': 'positions', 'polymarket-open-': 'predictions' } as const;
  for (const key of storage.getAllKeys()) {
    for (const [prefix, section] of Object.entries(sections)) {
      if (!key.startsWith(prefix)) continue;
      const address = key.slice(prefix.length);
      toggles[address] = { ...(toggles[address] ?? DEFAULT_TOGGLES), [section]: storage.getBoolean(key) ?? false };
    }
  }
  return toggles;
}
