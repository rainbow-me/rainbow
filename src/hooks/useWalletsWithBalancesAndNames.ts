import { useMemo } from 'react';
import useWalletBalances from './useWalletBalances';
import useWallets from './useWallets';

export default function useWalletsWithBalancesAndNames() {
  const { walletNames, wallets } = useWallets();
  const walletBalances = useWalletBalances(wallets);

  const walletsWithBalancesAndNames = useMemo(() => {
    if (!wallets) return {};
    return Object.entries(wallets).reduce((acc, [key, wallet]) => {
      // @ts-expect-error FIXME: Object is of type 'unknown'.
      acc[key] = {
        // @ts-expect-error FIXME: Object is of type 'unknown'.
        ...wallet,
        // @ts-expect-error FIXME: Object is of type 'unknown'.
        addresses: (wallet.addresses ?? []).map(account => ({
          ...account,
          // @ts-expect-error FIXME: Object is of type 'unknown'.
          balance: walletBalances[account.address],
          ens: walletNames[account.address],
        })),
      };

      return acc;
    }, {});
  }, [walletBalances, walletNames, wallets]);

  return walletsWithBalancesAndNames;
}
