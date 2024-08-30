import { values } from 'lodash';
import useWalletsWithBalancesAndNames from './useWalletsWithBalancesAndNames';
import walletTypes from '@/helpers/walletTypes';
import { useMemo } from 'react';
import { RainbowAccount } from '@/model/wallet';

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
