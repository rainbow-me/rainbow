import { map, mapValues } from 'lodash';
import { useMemo } from 'react';
import {
  convertRawAmountToDecimalFormat,
  handleSignificantDecimals,
} from '../helpers/utilities';
import useWalletBalances from './useWalletBalances';
import useWallets from './useWallets';

export const useWalletsWithBalancesAndNames = () => {
  const { walletNames, wallets } = useWallets();
  const walletBalances = useWalletBalances(wallets);

  const walletsWithBalancesAndNames = useMemo(
    () =>
      mapValues(wallets, wallet => {
        const updatedAccounts = map(wallet.addresses, account => {
          const balance = walletBalances[account.address];
          const decimalFormatAmount = convertRawAmountToDecimalFormat(
            balance,
            18
          );
          return {
            ...account,
            balance: handleSignificantDecimals(decimalFormatAmount, 4),
            ens: walletNames[account.address],
          };
        });
        return { ...wallet, addresses: updatedAccounts };
      }),
    [walletBalances, walletNames, wallets]
  );

  return walletsWithBalancesAndNames;
};
