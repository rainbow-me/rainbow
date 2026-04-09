import { useMemo } from 'react';

import { values } from 'lodash';

import walletTypes from '@/helpers/walletTypes';
import { type RainbowAccount } from '@/model/wallet';

import useWalletsWithBalancesAndNames from './useWalletsWithBalancesAndNames';

export default function useUserAccounts() {
  const walletsWithBalancesAndNames = useWalletsWithBalancesAndNames();

  const userAccounts = useMemo(() => {
    const filteredWallets = values(walletsWithBalancesAndNames).filter(wallet => wallet.type !== walletTypes.readOnly);
    const addresses: RainbowAccount[] = [];
    filteredWallets.forEach(wallet => {
      wallet.addresses?.forEach(account => {
        addresses.push({
          ...account,
        });
      });
    });
    return addresses;
  }, [walletsWithBalancesAndNames]);

  const watchedAccounts = useMemo(() => {
    const filteredWallets = values(walletsWithBalancesAndNames).filter(wallet => wallet.type === walletTypes.readOnly);
    const addresses: RainbowAccount[] = [];
    filteredWallets.forEach(wallet => {
      wallet.addresses?.forEach(account => {
        addresses.push({
          ...account,
        });
      });
    });
    return addresses;
  }, [walletsWithBalancesAndNames]);

  return {
    userAccounts,
    watchedAccounts,
  };
}
