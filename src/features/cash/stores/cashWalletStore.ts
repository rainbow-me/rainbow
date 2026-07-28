import { createBaseStore } from '@storesjs/stores';

export type LinkedWallet = {
  id: string;
  address: string;
};

type CashWalletStore = {
  linkedWallets: LinkedWallet[];
  setLinkedWallets: (linkedWallets: LinkedWallet[]) => void;
  addLinkedWallet: (linkedWallet: LinkedWallet) => void;
  clear: () => void;
};

// A positive cache: an address missing here means "ask the server", never "not linked".
export const useCashWalletStore = createBaseStore<CashWalletStore>(
  set => ({
    linkedWallets: [],
    setLinkedWallets: linkedWallets => set({ linkedWallets }),
    addLinkedWallet: linkedWallet => set(state => ({ linkedWallets: [...state.linkedWallets, linkedWallet] })),
    clear: () => set({ linkedWallets: [] }),
  }),
  { storageKey: 'cashWallet' }
);

export function hasLinkedWalletInCache(address: string): boolean {
  const normalized = address.toLowerCase();
  return useCashWalletStore.getState().linkedWallets.some(wallet => wallet.address === normalized);
}
