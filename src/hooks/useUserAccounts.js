import { values } from 'lodash';

import useAccountSettings from './useAccountSettings';
import useWalletsWithBalancesAndNames from './useWalletsWithBalancesAndNames';
import walletTypes from '@rainbow-me/helpers/walletTypes';

export default function useUserAccounts() {
  const walletsWithBalancesAndNames = useWalletsWithBalancesAndNames();
  const { network } = useAccountSettings();

  const userAccounts = useMemo(() => {
    const filteredWallets = values(walletsWithBalancesAndNames).filter(
      wallet => wallet.type !== walletTypes.readOnly
    );
    const addresses = [];
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
    const filteredWallets = values(walletsWithBalancesAndNames).filter(
      wallet => wallet.type === walletTypes.readOnly
    );
    const addresses = [];
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
