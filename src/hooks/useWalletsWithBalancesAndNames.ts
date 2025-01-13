import mapValues from 'lodash/mapValues';
import { useMemo } from 'react';
import { Address } from 'viem';
import { convertAmountToNativeDisplay, subtract } from '@/helpers/utilities';
import { userAssetsStoreManager } from '@/state/assets/userAssets';
import useAccountSettings from './useAccountSettings';
import useWalletBalances from './useWalletBalances';
import useWallets from './useWallets';

export default function useWalletsWithBalancesAndNames() {
  const { nativeCurrency } = useAccountSettings();
  const { walletNames, wallets } = useWallets();
  const { balances } = useWalletBalances(wallets || {});
  const hiddenBalances = userAssetsStoreManager(state => state.hiddenAssetBalances);

  const walletsWithBalancesAndNames = useMemo(
    () =>
      mapValues(wallets, wallet => {
        const updatedAccounts = (wallet.addresses || []).map(account => {
          const lowerCaseAddress = account.address.toLowerCase() as Address;
          return {
            ...account,
            balances: balances[lowerCaseAddress],
            hiddenBalances: hiddenBalances[lowerCaseAddress],
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
