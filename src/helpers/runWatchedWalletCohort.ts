import { useWallets } from '@/hooks';
import walletTypes from './walletTypes';
import { useEffect } from 'react';
import { analyticsV2 } from '@/analytics';
import * as ls from '@/storage';

const WATCHED_WALLET_COHORT_INTERVAL = 1000 * 60 * 60 * 24; // 1 day between cohort reports

export function useRunWatchedWalletCohort() {
  const { wallets } = useWallets();

  useEffect(() => {
    const watchedWallets = Object.values(wallets || {}).filter(wallet => wallet.type === walletTypes.readOnly);
    if (!watchedWallets.length) {
      return;
    }

    const lastReported = ls.watchedWalletCohort.get(['lastReported']);
    if (lastReported && Date.now() - lastReported < WATCHED_WALLET_COHORT_INTERVAL) {
      return;
    }

    ls.watchedWalletCohort.set(['lastReported'], Date.now());
    analyticsV2.track(analyticsV2.event.watchedWalletCohort, {
      numWatchedWallets: watchedWallets.length,
      watchedWalletsAddresses: watchedWallets.flatMap(wallet => wallet.addresses.map(acc => acc.address)),
    });
  }, [wallets]);
}
