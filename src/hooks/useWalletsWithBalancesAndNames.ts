import { convertAmountToNativeDisplay, subtract } from '@/helpers/utilities';
import { useWallets, useWalletsStore } from '@/state/wallets/walletsStore';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import mapValues from 'lodash/mapValues';
import { useMemo } from 'react';
import { Address } from 'viem';
import useWalletBalances from './useWalletBalances';

export default function useWalletsWithBalancesAndNames() {
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const walletNames = useWalletsStore(state => state.walletNames);
  const wallets = useWallets();
  const { balances } = useWalletBalances();
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
            ens: walletNames[account.address],
          };
        });
        return { ...wallet, addresses: updatedAccounts };
      }),
    [balances, hiddenBalances, nativeCurrency, walletNames, wallets]
  );

  return walletsWithBalancesAndNames;
}
