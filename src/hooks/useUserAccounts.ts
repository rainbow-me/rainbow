import { values } from 'lodash';
import {
  addDefaultNotificationSettingsForWallet,
  NotificationRelationship,
} from '@/notifications/settings';

import useAccountSettings from './useAccountSettings';
import useWalletsWithBalancesAndNames from './useWalletsWithBalancesAndNames';
import walletTypes from '@/helpers/walletTypes';
import { NOTIFICATIONS, useExperimentalFlag } from '@/config';
import { useDispatch } from 'react-redux';
import { notificationsSubscription } from '@/redux/explorer';

export default function useUserAccounts() {
  const dispatch = useDispatch();
  const walletsWithBalancesAndNames = useWalletsWithBalancesAndNames();
  const isNotificationsEnabled = useExperimentalFlag(NOTIFICATIONS);

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

        if (isNotificationsEnabled) {
          dispatch(notificationsSubscription(account.address));
          addDefaultNotificationSettingsForWallet(
            account.address,
            NotificationRelationship.OWNER
          );
        }
      });
    });
    return addresses;
  }, [dispatch, isNotificationsEnabled, network, walletsWithBalancesAndNames]);

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

        if (isNotificationsEnabled) {
          dispatch(notificationsSubscription(account.address));
          addDefaultNotificationSettingsForWallet(
            account.address,
            NotificationRelationship.WATCHER
          );
        }
      });
    });
    return addresses;
  }, [dispatch, isNotificationsEnabled, network, walletsWithBalancesAndNames]);

  return {
    userAccounts,
    watchedAccounts,
  };
}
