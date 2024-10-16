import mapValues from 'lodash/mapValues';
import { useMemo } from 'react';
import useWalletBalances from './useWalletBalances';
import useWalletsHiddenBalances from './useWalletsHiddenBalances';
import useWallets from './useWallets';
import { Address } from 'viem';

export default function useWalletsWithBalancesAndNames() {
  const { walletNames, wallets } = useWallets();
  const { balances } = useWalletBalances(wallets || {});
  const { hiddenBalances } = useWalletsHiddenBalances(wallets || {});

  const walletsWithBalancesAndNames = useMemo(
    () =>
      mapValues(wallets, wallet => {
        const updatedAccounts = (wallet.addresses || []).map(account => {
          const lowerCaseAddress = account.address.toLowerCase() as Address;
          return {
            ...account,
            balances: balances[lowerCaseAddress],
            hiddenBalances: hiddenBalances[lowerCaseAddress],
            ens: walletNames[account.address],
          };
        });
        return { ...wallet, addresses: updatedAccounts };
      }),
    [balances, hiddenBalances, walletNames, wallets]
  );

  return walletsWithBalancesAndNames;
}
