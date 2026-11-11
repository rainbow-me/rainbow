import { createDerivedStore } from '@storesjs/stores';

import { usePolymarketBalanceStore } from '@/features/polymarket/stores/polymarketBalanceStore';
import { usePolymarketWalletStore } from '@/features/polymarket/stores/polymarketWalletKindStore';

/** Available cash and loading errors for the selected Polymarket wallet. */
export const useAvailablePolymarketBalance = createDerivedStore(
  $ => {
    const balance = $(usePolymarketBalanceStore, s => s.getBalance(undefined, false));
    const walletFailed = $(usePolymarketWalletStore, s => {
      if (s.getData()) return false;
      return s.getStatus('isError') && !s.getStatus('isLoading');
    });
    const balanceFailed = $(usePolymarketBalanceStore, s => s.getStatus('isError') && !s.getStatus('isLoading'));

    return { balance, isError: walletFailed || balanceFailed };
  },
  { lockDependencies: true }
);

export function retryPolymarketBalance() {
  const wallet = usePolymarketWalletStore.getState();

  if (!wallet.getData()) return wallet.fetch();

  return usePolymarketBalanceStore.getState().fetch();
}
