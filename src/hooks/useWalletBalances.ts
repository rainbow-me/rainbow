import { add, convertAmountToNativeDisplay } from '@/helpers/utilities';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useWalletSummary } from '@/state/wallets/useWalletSummaryStore';
import { useWallets } from '@/state/wallets/walletsStore';
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
  isLoading: boolean;
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
  const [summaryData, { isInitialLoading: isLoading }] = useWalletSummary();

  const balances = useMemo(() => {
    const allAddresses = Object.values(wallets || {}).flatMap(wallet =>
      (wallet.addresses || []).map(account => account.address as Address)
    );

    const result: Record<Address, WalletBalance> = {};

    if (isLoading) return result;

    for (const address of allAddresses) {
      const lowerCaseAddress = address.toLowerCase() as Address;
      const assetBalance = summaryData?.addresses?.[lowerCaseAddress]?.summary?.asset_value?.toString() || '0';
      const positionsBalance = summaryData?.addresses?.[lowerCaseAddress]?.summary?.positions_value?.toString() || '0';
      const claimablesBalance = summaryData?.addresses?.[lowerCaseAddress]?.summary?.claimables_value?.toString() || '0';

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
  }, [isLoading, wallets, summaryData?.addresses, nativeCurrency]);

  return {
    balances,
    isLoading,
  };
};

export default useWalletBalances;
