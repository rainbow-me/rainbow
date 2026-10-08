import { useMemo } from 'react';

import { useListen } from '@storesjs/stores';
import mapValues from 'lodash/mapValues';

import { useWalletBalancesStore } from '@/features/wallet/data/stores/walletBalancesStore';
import { useWallets } from '@/state/wallets/walletsStore';

import { liveBalancesSummary } from './useLiveWalletBalance';

export default function useWalletsWithBalancesAndNames() {
  const wallets = useWallets();
  const balances = useWalletBalancesStore(state => state.balances);

  // This hook also runs on the wallet screen, so balances are cached while the switcher is closed.
  useListen(
    liveBalancesSummary,
    state => state,
    snapshot => useWalletBalancesStore.getState().cacheBalance(snapshot),
    { fireImmediately: true }
  );

  return useMemo(
    () =>
      mapValues(wallets, wallet => ({
        ...wallet,
        addresses: (wallet.addresses || []).map(account => ({
          ...account,
          balances: balances[account.address.toLowerCase()],
          balancesMinusHiddenBalances: balances[account.address.toLowerCase()]?.balanceMinusHiddenDisplay,
        })),
      })),
    [balances, wallets]
  );
}
