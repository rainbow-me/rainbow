import { values } from 'lodash';

import useAccountSettings from './useAccountSettings';
import useWallets from './useWallets';
import walletTypes from '@rainbow-me/helpers/walletTypes';

export default function useUserAccounts() {
  const { wallets } = useWallets();
  const { network } = useAccountSettings();

  const userAccounts = useMemo(() => {
    const filteredWallets = values(wallets).filter(
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
  }, [network, wallets]);

  return {
    userAccounts,
  };
}
