import { useMemo } from 'react';
import useWalletBalances from './useWalletBalances';
import useWallets from './useWallets';

export default function useWalletsWithBalancesAndNames() {
  const { walletNames, wallets } = useWallets();
  const walletBalances = useWalletBalances(wallets);

  const walletsWithBalancesAndNames = useMemo(() => {
    if (!wallets) return {};
    return Object.entries(wallets).reduce((acc, [key, wallet]) => {
      acc[key] = {
        ...wallet,
        addresses: (wallet.addresses ?? []).map(account => ({
          ...account,
          balance: walletBalances[account.address],
          ens: walletNames[account.address],
        })),
      };

      return acc;
    }, {});
  }, [walletBalances, walletNames, wallets]);

  return walletsWithBalancesAndNames;
}
