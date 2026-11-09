import { createBaseStore } from '@storesjs/stores';

export const MAX_PINNED_ADDRESSES = 6;

type Address = string;

export interface PinnedWalletsStore {
  pinnedAddresses: Address[];
  unpinnedAddresses: Address[];
  hasShownEditHintTooltip: boolean;
  hasAutoPinnedAddresses: boolean;
  canPinAddresses: () => boolean;
  pinWallet: (address: Address) => void;
  unpinWallet: (address: Address) => void;
  setPinnedAddresses: (newOrder: Address[]) => void;
  setUnpinnedAddresses: (newOrder: Address[]) => void;
  isPinnedAddress: (address: Address) => boolean;
}

export const usePinnedWalletsStore = createBaseStore<PinnedWalletsStore>(
  (set, get) => ({
    pinnedAddresses: [],
    unpinnedAddresses: [],
    hasShownEditHintTooltip: false,
    hasAutoPinnedAddresses: false,

    canPinAddresses: () => {
      return get().pinnedAddresses.length < MAX_PINNED_ADDRESSES;
    },

    isPinnedAddress: address => {
      return get().pinnedAddresses.some(pinnedAddress => pinnedAddress === address);
    },

    pinWallet: address => {
      const { pinnedAddresses, unpinnedAddresses } = get();

      if (pinnedAddresses.length >= MAX_PINNED_ADDRESSES) return;

      set({
        pinnedAddresses: [...pinnedAddresses, address],
        unpinnedAddresses: unpinnedAddresses.filter(addr => addr !== address),
      });
    },

    unpinWallet: address => {
      const { pinnedAddresses, unpinnedAddresses } = get();

      const match = pinnedAddresses.find(pinnedAddress => pinnedAddress === address);

      if (match) {
        set({
          pinnedAddresses: pinnedAddresses.filter(pinnedAddress => pinnedAddress !== address),
          unpinnedAddresses: [address, ...unpinnedAddresses],
        });
      }
    },

    setPinnedAddresses: newPinnedAddresses => {
      if (!get().hasAutoPinnedAddresses) {
        set({ hasAutoPinnedAddresses: true });
      }

      set({ pinnedAddresses: newPinnedAddresses });
    },

    setUnpinnedAddresses: newUnpinnedAddresses => {
      set({ unpinnedAddresses: newUnpinnedAddresses });
    },
  }),
  {
    partialize: state => ({
      hasAutoPinnedAddresses: state.hasAutoPinnedAddresses,
      hasShownEditHintTooltip: state.hasShownEditHintTooltip,
      pinnedAddresses: state.pinnedAddresses,
      unpinnedAddresses: state.unpinnedAddresses,
    }),
    storageKey: 'pinnedWallets',
    version: 1,
  }
);
