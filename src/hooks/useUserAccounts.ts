import { values } from 'lodash';
import useAccountSettings from './useAccountSettings';
import useWalletsWithBalancesAndNames from './useWalletsWithBalancesAndNames';
import walletTypes from '@/helpers/walletTypes';

export default function useUserAccounts() {
  const walletsWithBalancesAndNames = useWalletsWithBalancesAndNames();
  const { network } = useAccountSettings();

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useMemo'.
  const userAccounts = useMemo(() => {
    const filteredWallets = values(walletsWithBalancesAndNames).filter(
      wallet => wallet.type !== walletTypes.readOnly
    );
    const addresses: any = [];
    filteredWallets.forEach(wallet => {
      wallet.addresses.forEach((account: any) => {
        addresses.push({
          ...account,
          network,
        });
      });
    });
    return addresses;
  }, [network, walletsWithBalancesAndNames]);

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useMemo'.
  const watchedAccounts = useMemo(() => {
    const filteredWallets = values(walletsWithBalancesAndNames).filter(
      wallet => wallet.type === walletTypes.readOnly
    );
    const addresses: any = [];
    filteredWallets.forEach(wallet => {
      wallet.addresses.forEach((account: any) => {
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
