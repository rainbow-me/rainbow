import { map, mapValues } from 'lodash';
import { useMemo } from 'react';
import useWalletBalances from './useWalletBalances';
import useWallets from './useWallets';

export const useWalletsWithBalancesAndNames = () => {
  const { walletNames, wallets } = useWallets();
  const walletBalances = useWalletBalances(wallets);

  const walletsWithBalancesAndNames = useMemo(
    () =>
      mapValues(wallets, wallet => {
        const updatedAccounts = map(wallet.addresses, account => ({
          ...account,
          balance: walletBalances[account.address],
          ens: walletNames[account.address],
        }));
        return { ...wallet, addresses: updatedAccounts };
      }),
    [walletBalances, walletNames, wallets]
  );

  return walletsWithBalancesAndNames;
};
