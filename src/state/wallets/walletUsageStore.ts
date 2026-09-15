import { createBaseStore, createDerivedStore, type InferStoreState } from '@storesjs/stores';

import { type RainbowAccount, type RainbowWallet } from '@/features/wallet/types';
import { useWalletsStore } from '@/state/wallets/walletsStore';

type WalletAccount = { wallet: RainbowWallet; account: RainbowAccount };
type WalletUsage = Record<string, number>;
type WalletsState = InferStoreState<typeof useWalletsStore>;

const PREVIOUS_USAGE_WEIGHT = 0.9;
const MAX_RECENT_WALLETS = 8;

const walletUsageStore = createBaseStore<{ usage: WalletUsage }>(() => ({ usage: {} }), {
  storageKey: 'walletUsage',
  version: 1,
});

/**
 * Visible wallets ranked by recent use. Unvisited wallets are not suggested.
 */
export const useRecentWalletsStore = createDerivedStore(
  $ => {
    const wallets = $(useWalletsStore, s => s.wallets);
    const selectedWalletId = $(useWalletsStore, s => s.selected?.id);
    const usage = $(walletUsageStore, s => s.usage);

    const accounts: Record<string, WalletAccount> = {};

    for (const wallet of Object.values(wallets)) {
      for (const account of wallet.addresses) {
        if (!account.visible) continue;
        const address = account.address.toLowerCase();
        if (usage[address] > 0 && (!accounts[address] || wallet.id === selectedWalletId)) {
          accounts[address] = { account, wallet };
        }
      }
    }

    return Object.entries(accounts)
      .sort(([a], [b]) => usage[b] - usage[a])
      .slice(0, MAX_RECENT_WALLETS)
      .map(([, account]) => account);
  },
  { lockDependencies: true }
);

/**
 * Record wallet visits and reconcile the visible inventory.
 */
export function updateWalletUsage(state: WalletsState, previous: WalletsState): void {
  if (!state.walletReady) {
    if (previous.walletReady) walletUsageStore.setState({ usage: {} });
    return;
  }

  const address = state.accountAddress.toLowerCase();
  const addressChanged = address !== previous.accountAddress.toLowerCase();
  const refreshInventory = state === previous || state.wallets !== previous.wallets;

  if (!refreshInventory && state.walletReady === previous.walletReady && !addressChanged) return;

  const previousUsage = walletUsageStore.getState().usage;
  let usage = previousUsage;
  let isVisible = usage[address] !== undefined;

  if (refreshInventory || !previous.walletReady || !isVisible) {
    const visibleAddresses = new Set<string>();
    for (const wallet of Object.values(state.wallets)) {
      for (const account of wallet.addresses) {
        if (account.visible) visibleAddresses.add(account.address.toLowerCase());
      }
    }

    isVisible = visibleAddresses.has(address);
    for (const key in usage) {
      if (visibleAddresses.has(key)) continue;
      if (usage === previousUsage) usage = { ...usage };
      delete usage[key];
    }
  }

  const isFirstVisit = isVisible && ((previous.walletReady && addressChanged) || usage[address] === undefined);
  if (isFirstVisit) {
    usage = { ...usage };
    for (const key in usage) usage[key] *= PREVIOUS_USAGE_WEIGHT;
    usage[address] = (usage[address] ?? 0) + 1;
  }

  if (usage !== previousUsage) walletUsageStore.setState({ usage });
}
