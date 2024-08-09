import mapValues from 'lodash/mapValues';
import { useMemo } from 'react';
import useWalletBalances from './useWalletBalances';
import useWallets from './useWallets';
import { Address } from 'viem';

export default function useWalletsWithBalancesAndNames() {
  const { walletNames, wallets } = useWallets();
  const { balances, isLoading } = useWalletBalances(wallets || {});

  const walletsWithBalancesAndNames = useMemo(
    () =>
      mapValues(wallets, wallet => {
        const updatedAccounts = (wallet.addresses ?? []).map(account => ({
          ...account,
          balance: balances[account.address.toLowerCase() as Address]?.totalBalanceDisplay,
          ens: walletNames[account.address],
        }));
        return { ...wallet, addresses: updatedAccounts };
      }),
    [balances, walletNames, wallets]
  );

  return { isLoading, walletsWithBalancesAndNames };
}
