import mapValues from 'lodash/mapValues';
import { useMemo } from 'react';
import useWalletBalances from './useWalletBalances';
import useWallets from './useWallets';
import { Address } from 'viem';

export default function useWalletsWithBalancesAndNames() {
  const { walletNames, wallets } = useWallets();
  const walletBalances = useWalletBalances(wallets!);

  const walletsWithBalancesAndNames = useMemo(
    () =>
      mapValues(wallets, wallet => {
        const updatedAccounts = (wallet.addresses ?? []).map(account => ({
          ...account,
          balance: walletBalances?.balances?.[account.address?.toLowerCase() as Address]?.summary?.asset_value,
          ens: walletNames[account.address],
        }));
        return { ...wallet, addresses: updatedAccounts };
      }),
    [walletBalances, walletNames, wallets]
  );

  return walletsWithBalancesAndNames;
}
