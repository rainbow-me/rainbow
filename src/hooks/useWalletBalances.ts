import { AllRainbowWallets } from '@/model/wallet';
import { useMemo } from 'react';
import { Address } from 'viem';
import useAccountSettings from './useAccountSettings';
import { useAddysSummary } from '@/resources/summary/summary';
import { add, convertAmountToNativeDisplay } from '@/helpers/utilities';

const QUERY_CONFIG = {
  staleTime: 60_000, // 1 minute
  cacheTime: 1000 * 60 * 60 * 24, // 24 hours
  refetchInterval: 120_000, // 2 minutes
};

export type WalletBalance = {
  assetBalanceAmount: string;
  assetBalanceDisplay: string;
  positionsBalanceAmount: string;
  positionsBalanceDisplay: string;
  totalBalanceAmount: string;
  totalBalanceDisplay: string;
};

export type WalletBalanceResult = {
  balances: Record<Address, WalletBalance>;
  isLoading: boolean;
};

/**
 * Hook to fetch balances for all wallets
 * @deprecated - you probably want to use useWalletsWithBalancesAndNames instead which accounts for hidden assets balances
 * @param wallets - All Rainbow wallets
 * @returns Balances for all wallets
 */
const useWalletBalances = (wallets: AllRainbowWallets): WalletBalanceResult => {
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

  const balances = useMemo(() => {
    const result: Record<Address, WalletBalance> = {};

    if (isLoading) return result;

    for (const address of allAddresses) {
      const lowerCaseAddress = address.toLowerCase() as Address;
      const assetBalance = summaryData?.data?.addresses?.[lowerCaseAddress]?.summary?.asset_value?.toString() || '0';
      const positionsBalance = summaryData?.data?.addresses?.[lowerCaseAddress]?.summary?.positions_value?.toString() || '0';
      const claimablesBalance = summaryData?.data?.addresses?.[lowerCaseAddress]?.summary?.claimables_value?.toString() || '0';

      const totalAccountBalance = add(assetBalance, add(positionsBalance, claimablesBalance));

      result[lowerCaseAddress] = {
        assetBalanceAmount: assetBalance,
        assetBalanceDisplay: convertAmountToNativeDisplay(assetBalance, nativeCurrency),
        positionsBalanceAmount: positionsBalance,
        positionsBalanceDisplay: convertAmountToNativeDisplay(positionsBalance, nativeCurrency),
        totalBalanceAmount: totalAccountBalance,
        totalBalanceDisplay: convertAmountToNativeDisplay(totalAccountBalance, nativeCurrency),
      };
    }

    return result;
  }, [isLoading, allAddresses, summaryData?.data?.addresses, nativeCurrency]);

  return {
    balances,
    isLoading,
  };
};

export default useWalletBalances;
