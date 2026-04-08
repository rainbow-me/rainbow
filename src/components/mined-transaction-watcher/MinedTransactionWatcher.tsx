import { memo } from 'react';
import { useTransactionWatcher } from '@/hooks/useTransactionWatcher';
import { useWatchAssetUpdateTransactions } from '@/hooks/useWatchMinedTransactions';
import { type WatchedAssetUpdateTransaction, useAssetUpdatesStore } from '@/state/minedTransactions/minedTransactions';
import { useAccountAddress } from '@/state/wallets/walletsStore';

const EMPTY_ASSET_UPDATE_TRANSACTION_WATCHES: WatchedAssetUpdateTransaction[] = [];

export const AssetUpdateTransactionWatcher = memo(function AssetUpdateTransactionWatcher() {
  const address = useAccountAddress();
  const watchedTransactions = useAssetUpdatesStore(state => state.watchedTransactions[address] || EMPTY_ASSET_UPDATE_TRANSACTION_WATCHES);

  useTransactionWatcher({
    transactions: watchedTransactions,
    watchFunction: useWatchAssetUpdateTransactions({ address }),
  });

  return null;
});
