import { add, convertAmountToNativeDisplay } from '@/helpers/utilities';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useWalletSummary } from '@/state/wallets/useWalletSummaryStore';
import { getWalletAddresses, useWallets } from '@/state/wallets/walletsStore';
import { useMemo } from 'react';
import { Address } from 'viem';

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
};

/**
 * Hook to fetch balances for all wallets
 * @deprecated - you probably want to use useWalletsWithBalancesAndNames instead which accounts for hidden assets balances
 * @param wallets - All Rainbow wallets
 * @returns Balances for all wallets
 */
const useWalletBalances = (): WalletBalanceResult => {
  const wallets = useWallets();

  const nativeCurrency = userAssetsStoreManager().currency;
  const summaryData = useWalletSummary();

  const balances = useMemo(() => {
    const allAddresses = getWalletAddresses(wallets || {});

    const result: Record<Address, WalletBalance> = {};

    if (!summaryData) return result;

    for (const address of allAddresses) {
      const lowerCaseAddress = address.toLowerCase() as Address;
      const assetBalance = summaryData.addresses?.[lowerCaseAddress]?.summary?.asset_value?.toString() || '0';
      const positionsBalance = summaryData.addresses?.[lowerCaseAddress]?.summary?.positions_value?.toString() || '0';
      const claimablesBalance = summaryData.addresses?.[lowerCaseAddress]?.summary?.claimables_value?.toString() || '0';

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
  }, [wallets, summaryData, nativeCurrency]);

  return {
    balances,
  };
};

export default useWalletBalances;
