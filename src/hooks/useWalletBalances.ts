import { useMemo } from 'react';
import { Address } from 'viem';
import useAccountSettings from './useAccountSettings';
import { useAddysSummary } from '@/resources/addys/summary';
import { add, convertAmountToNativeDisplay } from '@/helpers/utilities';
import { useWalletsStore } from '@/state/wallets/walletsStore';

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
const useWalletBalances = (): WalletBalanceResult => {
  const { nativeCurrency } = useAccountSettings();
  const [summaryData, { isInitialLoading: isLoading }] = useAddysSummary();
  const allAddresses = useWalletsStore(state => state.walletsAddresses);

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
