import { useMemo } from 'react';

import mapValues from 'lodash/mapValues';
import { type Address } from 'viem';

import { convertAmountToNativeDisplay } from '@/features/currency/utils/nativeDisplay';
import { subtract } from '@/helpers/utilities';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useWallets } from '@/state/wallets/walletsStore';

import useWalletBalances from './useWalletBalances';

export default function useWalletsWithBalancesAndNames() {
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const wallets = useWallets();
  const { balances } = useWalletBalances(wallets);
  const hiddenBalances = userAssetsStoreManager(state => state.hiddenAssetBalances);

  const walletsWithBalancesAndNames = useMemo(
    () =>
      mapValues(wallets, wallet => {
        const updatedAccounts = (wallet.addresses || []).map(account => {
          const lowerCaseAddress = account.address.toLowerCase() as Address;

          return {
            ...account,
            balances: balances[lowerCaseAddress],
            hiddenBalances: hiddenBalances[account.address],
            balancesMinusHiddenBalances: balances[lowerCaseAddress]?.totalBalanceDisplay
              ? convertAmountToNativeDisplay(
                  subtract(balances[lowerCaseAddress].totalBalanceAmount, hiddenBalances[account.address] ?? '0'),
                  nativeCurrency
                )
              : undefined,
          };
        });
        return { ...wallet, addresses: updatedAccounts };
      }),
    [balances, hiddenBalances, nativeCurrency, wallets]
  );

  return walletsWithBalancesAndNames;
}
