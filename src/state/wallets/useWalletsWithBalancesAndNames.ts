import { createDerivedStore } from '@storesjs/stores';
import mapValues from 'lodash/mapValues';

import { convertAmountToNativeDisplay } from '@/features/currency/utils/nativeDisplay';
import { appSettingsActions } from '@/features/settings/data/appSettingsStore';
import { type RainbowAccount, type RainbowWallet } from '@/features/wallet/types';
import { subtract } from '@/helpers/utilities';
import { useHiddenAssetBalancesStore } from '@/state/wallets/hiddenAssetBalancesStore';
import { useWalletSummaryQueryStore } from '@/state/wallets/useWalletSummaryStore';
import { useWalletsStore } from '@/state/wallets/walletsStore';

type WalletBalance = {
  totalBalanceAmount: string;
  totalBalanceDisplay: string;
};

type ExtendedRainbowAccount = RainbowAccount & {
  balances?: WalletBalance;
  balancesMinusHiddenBalances?: string;
};

type ExtendedRainbowWallet = Omit<RainbowWallet, 'addresses'> & {
  addresses: ExtendedRainbowAccount[];
};

export type WalletWithBalancesAndNames = {
  [key: string]: ExtendedRainbowWallet;
};

const EMPTY_WALLETS: Readonly<WalletWithBalancesAndNames> = Object.freeze({});

export const useWalletsWithBalancesAndNames = createDerivedStore<WalletWithBalancesAndNames>(
  $ => {
    const summaryData = $(useWalletSummaryQueryStore, state => state.summary?.data);
    const wallets = $(useWalletsStore, state => state.wallets);

    if (!summaryData) return EMPTY_WALLETS;

    const balances: Partial<Record<string, WalletBalance>> = {};
    const nativeCurrency = appSettingsActions.getCurrency();
    const { hiddenAssetBalances } = useHiddenAssetBalancesStore.getState();

    for (const [address, { summary }] of Object.entries(summaryData.addresses)) {
      if (!summary) continue;

      const totalBalanceAmount = ((summary.asset_value ?? 0) + (summary.positions_value ?? 0) + (summary.claimables_value ?? 0)).toString();

      balances[address.toLowerCase()] = {
        totalBalanceAmount,
        totalBalanceDisplay: convertAmountToNativeDisplay(totalBalanceAmount, nativeCurrency),
      };
    }

    return mapValues(wallets, wallet => {
      const addresses = wallet.addresses.map(account => {
        const balance = balances[account.address.toLowerCase()];

        return {
          ...account,
          balances: balance,
          balancesMinusHiddenBalances: balance
            ? convertAmountToNativeDisplay(
                subtract(balance.totalBalanceAmount, hiddenAssetBalances[account.address] ?? '0'),
                nativeCurrency
              )
            : undefined,
        };
      });

      return { ...wallet, addresses };
    });
  },
  { lockDependencies: true }
);
