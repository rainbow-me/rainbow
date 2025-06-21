import { useWalletSummary } from '@/state/wallets/useWalletSummaryStore';
import { useWalletAddresses } from '@/state/wallets/walletsStore';
import { useMemo } from 'react';
import { Address } from 'viem';

export type WalletTransactionCountsResult = {
  transactionCounts: Record<string, number>;
  isLoading: boolean;
};

/**
 * @param wallets - All Rainbow wallets
 * @returns Number of transactions originating from Rainbow for each wallet
 */
export const useWalletTransactionCounts = (): WalletTransactionCountsResult => {
  const summaryData = useWalletSummary();
  const allAddresses = useWalletAddresses();

  const transactionCounts = useMemo(() => {
    const result: Record<Address, number> = {};

    if (!summaryData) return result;

    for (const address of allAddresses) {
      const lowerCaseAddress = address.toLowerCase() as Address;
      const transactionCount = summaryData.addresses?.[lowerCaseAddress]?.meta.rainbow?.transactions || 0;
      result[lowerCaseAddress] = transactionCount;
    }

    return result;
  }, [summaryData, allAddresses]);

  return {
    transactionCounts,
    isLoading: !summaryData,
  };
};
