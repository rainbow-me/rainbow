import { useMemo } from 'react';

import { type Address } from 'viem';

import { convertAmountToNativeDisplay } from '@/features/currency/utils/nativeDisplay';
import { type AllRainbowWallets } from '@/features/wallet/types';
import { add } from '@/helpers/utilities';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useWalletSummaryEntries } from '@/state/wallets/useWalletSummaryStore';
import { getWalletAddresses } from '@/state/wallets/walletsStore';

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
export const useWalletBalances = (wallets: AllRainbowWallets | null): WalletBalanceResult => {
  const summaryEntries = useWalletSummaryEntries();
  const nativeCurrency = userAssetsStoreManager(state => state.currency);

  const balances = useMemo(() => {
    const result: Record<Address, WalletBalance> = {};

    if (!summaryEntries || !wallets) {
      return result;
    }

    const allAddresses = getWalletAddresses(wallets);

    for (const address of allAddresses) {
      const lowerCaseAddress = address.toLowerCase() as Address;
      const summary = summaryEntries[lowerCaseAddress]?.balance;

      if (!summary) {
        continue;
      }

      const assetBalance = summary.assetValue?.toString() || '0';
      const positionsBalance = summary.positionsValue?.toString() || '0';
      const claimablesBalance = summary.claimablesValue?.toString() || '0';

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
  }, [summaryEntries, wallets, nativeCurrency]);

  return {
    balances,
  };
};
