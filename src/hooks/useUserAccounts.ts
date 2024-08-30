import { values } from 'lodash';
import useWalletsWithBalancesAndNames from './useWalletsWithBalancesAndNames';
import walletTypes from '@/helpers/walletTypes';
import { useSelector } from 'react-redux';
import { AppState } from '@/redux/store';
import { useMemo } from 'react';
import { RainbowAccount } from '@/model/wallet';
import { Network } from '@/helpers';

export default function useUserAccounts() {
  const walletsWithBalancesAndNames = useWalletsWithBalancesAndNames();
  const network = useSelector((state: AppState) => state.settings.network);

  const userAccounts = useMemo(() => {
    const filteredWallets = values(walletsWithBalancesAndNames).filter(wallet => wallet.type !== walletTypes.readOnly);
    const addresses: (RainbowAccount & { network: Network })[] = [];
    filteredWallets.forEach(wallet => {
      wallet.addresses.forEach(account => {
        addresses.push({
          ...account,
          network,
        });
      });
    });
    return addresses;
  }, [network, walletsWithBalancesAndNames]);

  const watchedAccounts = useMemo(() => {
    const filteredWallets = values(walletsWithBalancesAndNames).filter(wallet => wallet.type === walletTypes.readOnly);
    const addresses: (RainbowAccount & { network: Network })[] = [];
    filteredWallets.forEach(wallet => {
      wallet.addresses.forEach(account => {
        addresses.push({
          ...account,
          network,
        });
      });
    });
    return addresses;
  }, [network, walletsWithBalancesAndNames]);

  return {
    userAccounts,
    watchedAccounts,
  };
}
