import { useMemo } from 'react';
import useWalletBalances from './useWalletBalances';
import useWallets from './useWallets';

export default function useWalletsWithBalancesAndNames() {
  const { walletNames, wallets } = useWallets();
  const walletBalances = useWalletBalances(wallets);

  const walletsWithBalancesAndNames = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(wallets ?? {}).map(([key, wallet]) => [
          key,
          {
            ...wallet,
            addresses: (wallet.addresses ?? []).map(account => ({
              ...account,
              balance: walletBalances[account.address],
              ens: walletNames[account.address],
            })),
          },
        ])
      ),
    [walletBalances, walletNames, wallets]
  );

  return walletsWithBalancesAndNames;
}
