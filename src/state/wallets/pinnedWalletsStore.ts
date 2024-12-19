import { createRainbowStore } from '@/state/internal/createRainbowStore';

export const MAX_PINNED_ADDRESSES = 6;

type Address = string;

interface PinnedWalletsStore {
  pinnedAddresses: Address[];
  unpinnedAddresses: Address[];
  hasShownEditHintTooltip: boolean;
  hasAutoPinnedAddresses: boolean;
  canPinAddresses: () => boolean;
  addPinnedAddress: (address: Address) => void;
  removePinnedAddress: (address: Address) => void;
  setPinnedAddresses: (newOrder: Address[]) => void;
  setUnpinnedAddresses: (newOrder: Address[]) => void;
  isPinnedAddress: (address: Address) => boolean;
}

export const usePinnedWalletsStore = createRainbowStore<PinnedWalletsStore>(
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

    addPinnedAddress: address => {
      const { pinnedAddresses } = get();

      if (pinnedAddresses.length >= MAX_PINNED_ADDRESSES) return;

      set({ pinnedAddresses: [...pinnedAddresses, address] });
    },

    removePinnedAddress: address => {
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
    storageKey: 'pinnedWallets',
    version: 1,
  }
);
