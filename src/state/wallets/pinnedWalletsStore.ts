import { createRainbowStore } from '@/state/internal/createRainbowStore';

const MIN_WALLETS_TO_SHOW_PINNING = 6;
const MAX_PINNED_WALLETS = 6;

// TODO: fix
type Address = string;

interface PinnedWalletsStore {
  pinnedAddresses: Address[];
  unpinnedAddresses: Address[];
  hasShownEditHintTooltip: boolean;
  canPinAddresses: () => boolean;
  addPinnedAddress: (address: Address) => void;
  removePinnedAddress: (address: Address) => void;
  reorderPinnedAddresses: (newOrder: Address[]) => void;
  reorderUnpinnedAddresses: (newOrder: Address[]) => void;
  isPinnedAddress: (address: Address) => boolean;
}

export const usePinnedWalletsStore = createRainbowStore<PinnedWalletsStore>(
  (set, get) => ({
    pinnedAddresses: [],
    unpinnedAddresses: [],
    hasShownEditHintTooltip: false,

    canPinAddresses: () => {
      const { pinnedAddresses } = get();
      return pinnedAddresses.length >= MIN_WALLETS_TO_SHOW_PINNING && pinnedAddresses.length < MAX_PINNED_WALLETS;
    },

    isPinnedAddress: address => {
      return get().pinnedAddresses.some(pinnedAddress => pinnedAddress === address);
    },

    addPinnedAddress: address => {
      const { pinnedAddresses } = get();

      if (pinnedAddresses.length >= MAX_PINNED_WALLETS) return;

      set({ pinnedAddresses: [...pinnedAddresses, address] });
    },

    removePinnedAddress: address => {
      const { pinnedAddresses } = get();

      const match = pinnedAddresses.find(pinnedAddress => pinnedAddress === address);

      if (match) {
        set({ pinnedAddresses: pinnedAddresses.filter(pinnedAddress => pinnedAddress !== address) });
      }
    },

    reorderPinnedAddresses: newPinnedAddresses => {
      set({ pinnedAddresses: newPinnedAddresses });
    },

    reorderUnpinnedAddresses: newUnpinnedAddresses => {
      set({ unpinnedAddresses: newUnpinnedAddresses });
    },
  }),
  {
    storageKey: 'pinnedWallets',
    version: 1,
  }
);
