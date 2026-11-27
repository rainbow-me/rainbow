import { useMemo } from 'react';

import { type Address } from 'viem';

import { getVisibleWalletAddresses } from '@/features/wallet/utils/visibleWalletAddresses';
import { hasFetchedAddresses, useWalletSummaryEntries } from '@/state/wallets/useWalletSummaryStore';
import { useWalletAddresses, useWalletsStore } from '@/state/wallets/walletsStore';
import { shallowEqual } from '@/worklets/comparisons';

export type WalletTransactionCountsResult = {
  transactionCounts: Record<string, number>;
  isLoading: boolean;
};

/**
 * @param wallets - All Rainbow wallets
 * @returns Number of transactions originating from Rainbow for each wallet
 */
export const useWalletTransactionCounts = (): WalletTransactionCountsResult => {
  const summaryEntries = useWalletSummaryEntries();
  const allAddresses = useWalletAddresses();
  const ownedAddresses = useWalletsStore(state => getVisibleWalletAddresses(state.wallets).owned, shallowEqual);

  const transactionCounts = useMemo(() => {
    const result: Record<Address, number> = {};

    if (!summaryEntries) return result;

    for (const address of allAddresses) {
      const lowerCaseAddress = address.toLowerCase() as Address;
      const transactionCount = summaryEntries[lowerCaseAddress]?.balance?.transactions || 0;
      result[lowerCaseAddress] = transactionCount;
    }

    return result;
  }, [summaryEntries, allAddresses]);

  return {
    transactionCounts,
    isLoading: !hasFetchedAddresses(summaryEntries, ownedAddresses),
  };
};
