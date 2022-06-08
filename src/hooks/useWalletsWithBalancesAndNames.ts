import { map, mapValues } from 'lodash';
import { useMemo } from 'react';
import useWalletBalances from './useWalletBalances';
import useWallets from './useWallets';

export default function useWalletsWithBalancesAndNames() {
  const { walletNames, wallets } = useWallets();
  const walletBalances = useWalletBalances(wallets);

  const walletsWithBalancesAndNames = useMemo(
    () =>
      mapValues(wallets, wallet => {
        const updatedAccounts = map(wallet.addresses, account => ({
          ...account,
          // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
          balance: walletBalances[account.address],
          ens: walletNames[account.address],
        }));
        return { ...wallet, addresses: updatedAccounts };
      }),
    [walletBalances, walletNames, wallets]
  );

  return walletsWithBalancesAndNames;
}
