import { AllRainbowWallets } from '@/model/wallet';
import { useMemo } from 'react';
import { Address } from 'viem';
import useAccountSettings from './useAccountSettings';
import { useAddysSummary } from '@/resources/summary/summary';

const QUERY_CONFIG = {
  staleTime: 60_000, // 1 minute
  cacheTime: 1000 * 60 * 60 * 24, // 24 hours
  refetchInterval: 120_000, // 2 minutes
};

export type WalletTransactionCountsResult = {
  transactionCounts: Record<string, number>;
  isLoading: boolean;
};

/**
 * @param wallets - All Rainbow wallets
 * @returns Number of transactions originating from Rainbow for each wallet
 */
export const useWalletTransactionCounts = (wallets: AllRainbowWallets): WalletTransactionCountsResult => {
  const { nativeCurrency } = useAccountSettings();

  const allAddresses = useMemo(
    () => Object.values(wallets).flatMap(wallet => (wallet.addresses || []).map(account => account.address as Address)),
    [wallets]
  );

  const { data: summaryData, isLoading } = useAddysSummary(
    {
      addresses: allAddresses,
      currency: nativeCurrency,
    },
    QUERY_CONFIG
  );

  const transactionCounts = useMemo(() => {
    const result: Record<Address, number> = {};

    if (isLoading) return result;

    for (const address of allAddresses) {
      const lowerCaseAddress = address.toLowerCase() as Address;
      const transactionCount = summaryData?.data?.addresses?.[lowerCaseAddress]?.meta.rainbow?.transactions || 0;
      result[lowerCaseAddress] = transactionCount;
    }

    return result;
  }, [isLoading, allAddresses, summaryData?.data?.addresses]);

  return {
    transactionCounts,
    isLoading,
  };
};
