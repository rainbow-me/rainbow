import { createDerivedStore } from '@storesjs/stores';
import mapValues from 'lodash/mapValues';
import { type Address } from 'viem';

import { convertAmountToNativeDisplay } from '@/features/currency/utils/nativeDisplay';
import { appSettingsActions } from '@/features/settings/data/appSettingsStore';
import { type RainbowAccount, type RainbowWallet } from '@/features/wallet/types';
import { subtract } from '@/helpers/utilities';
import { useHiddenAssetBalancesStore } from '@/state/wallets/hiddenAssetBalancesStore';
import { useWalletSummaryQueryStore } from '@/state/wallets/useWalletSummaryStore';
import { useWalletsStore } from '@/state/wallets/walletsStore';

type WalletBalance = {
  assetBalanceAmount: string;
  assetBalanceDisplay: string;
  positionsBalanceAmount: string;
  positionsBalanceDisplay: string;
  totalBalanceAmount: string;
  totalBalanceDisplay: string;
};

type ExtendedRainbowAccount = RainbowAccount & {
  balances?: WalletBalance;
  hiddenBalances?: string;
  balancesMinusHiddenBalances?: string;
};

type ExtendedRainbowWallet = Omit<RainbowWallet, 'addresses'> & {
  addresses: ExtendedRainbowAccount[];
};

export type WalletWithBalancesAndNames = {
  [key: string]: ExtendedRainbowWallet;
};

const EMPTY_WALLETS: Readonly<WalletWithBalancesAndNames> = Object.freeze({});

export const useWalletsWithBalancesAndNames = createDerivedStore<WalletWithBalancesAndNames>($ => {
  const summaryData = $(useWalletSummaryQueryStore, state => state.summary?.data);
  const wallets = $(useWalletsStore, state => state.wallets);

  if (!summaryData || !wallets) return EMPTY_WALLETS;

  const balances: Record<Address, WalletBalance> = {};
  const nativeCurrency = appSettingsActions.getCurrency();
  const { hiddenAssetBalances } = useHiddenAssetBalancesStore.getState();

  for (const [address, data] of Object.entries(summaryData.addresses)) {
    const summary = data.summary;
    if (!summary) continue;

    const lowerCaseAddress = address.toLowerCase() as Address;
    const assetBalance = summary.asset_value?.toString() || '0';
    const positionsBalance = summary.positions_value?.toString() || '0';
    const claimablesBalance = summary.claimables_value?.toString() || '0';

    const totalAccountBalance = (Number(assetBalance) + Number(positionsBalance) + Number(claimablesBalance)).toString();

    balances[lowerCaseAddress] = {
      assetBalanceAmount: assetBalance,
      assetBalanceDisplay: convertAmountToNativeDisplay(assetBalance, nativeCurrency),
      positionsBalanceAmount: positionsBalance,
      positionsBalanceDisplay: convertAmountToNativeDisplay(positionsBalance, nativeCurrency),
      totalBalanceAmount: totalAccountBalance,
      totalBalanceDisplay: convertAmountToNativeDisplay(totalAccountBalance, nativeCurrency),
    };
  }

  const walletsWithBalancesAndNames = mapValues(wallets, wallet => {
    const updatedAccounts = (wallet.addresses || []).map(account => {
      const lowerCaseAddress = account.address.toLowerCase() as Address;

      return {
        ...account,
        balances: balances[lowerCaseAddress],
        hiddenBalances: hiddenAssetBalances[account.address],
        balancesMinusHiddenBalances: balances[lowerCaseAddress]?.totalBalanceDisplay
          ? convertAmountToNativeDisplay(
              subtract(balances[lowerCaseAddress].totalBalanceAmount, hiddenAssetBalances[account.address] ?? '0'),
              nativeCurrency
            )
          : undefined,
      };
    });

    return { ...wallet, addresses: updatedAccounts };
  });

  return walletsWithBalancesAndNames;
});
