import { createBaseStore, createDerivedStore, createStoreActions } from '@storesjs/stores';

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

export const useWalletListTogglesStore = createBaseStore<ListSectionTogglesState>(
  (set, get) => ({
    togglesByWallet: {},

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

  { persistThrottleMs: 0, storageKey: 'listSectionTogglesStore' }
);

export const useCurrentWalletToggles = createDerivedStore(
  $ => {
    const accountAddress = $(useWalletsStore, state => state.accountAddress);
    const togglesByWallet = $(useWalletListTogglesStore, state => state.togglesByWallet);

    if (!accountAddress) return DEFAULT_TOGGLES;

    return togglesByWallet[accountAddress] ?? DEFAULT_TOGGLES;
  },
  { lockDependencies: true }
);

export const walletListTogglesActions = createStoreActions(useWalletListTogglesStore);
