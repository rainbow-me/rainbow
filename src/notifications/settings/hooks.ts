import {
  GroupSettings,
  NotificationRelationshipType,
  WalletNotificationSettings,
} from '@/notifications/settings/types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  NotificationRelationship,
  WALLET_GROUPS_STORAGE_KEY,
  WALLET_TOPICS_STORAGE_KEY,
} from '@/notifications/settings/constants';
import { toggleGroupNotifications } from '@/notifications/settings/settings';
import {
  getAllNotificationSettingsFromStorage,
  getExistingGroupSettingsFromStorage,
  notificationSettingsStorage,
  updateGroupSettings,
} from '@/notifications/settings/storage';

/**
 Hook to constantly listen to notification settings.
 */
export const useAllNotificationSettingsFromStorage = () => {
  const data = getAllNotificationSettingsFromStorage();
  const existingGroupSettingsData = getExistingGroupSettingsFromStorage();

  const [notificationSettings, setNotificationSettings] = useState<
    WalletNotificationSettings[]
  >(data);
  const [
    existingGroupSettings,
    setExistingGroupSettings,
  ] = useState<GroupSettings>(existingGroupSettingsData);
  const listener = notificationSettingsStorage.addOnValueChangedListener(
    changedKey => {
      if (changedKey === WALLET_TOPICS_STORAGE_KEY) {
        const newSettings = notificationSettingsStorage.getString(changedKey);
        newSettings && setNotificationSettings(JSON.parse(newSettings));
      } else if (changedKey === WALLET_GROUPS_STORAGE_KEY) {
        const newSettings = notificationSettingsStorage.getString(changedKey);
        newSettings && setExistingGroupSettings(JSON.parse(newSettings));
      }
    }
  );
  useEffect(() => () => {
    listener.remove();
  });
  return { notificationSettings, existingGroupSettings };
};

/**
 Hook for getting and setting notification settings for all wallets
 in an owned/watched group.

 Returns a boolean for two groups: owned and watched.
 Provides a function for updating the group settings.
 */
export const useWalletGroupNotificationSettings = () => {
  const {
    notificationSettings,
    existingGroupSettings,
  } = useAllNotificationSettingsFromStorage();

  const ownerEnabled = existingGroupSettings[NotificationRelationship.OWNER];
  const watcherEnabled =
    existingGroupSettings[NotificationRelationship.WATCHER];

  const {
    lastWatchedWalletEnabled,
    lastOwnedWalletEnabled,
    allWatchedWalletsDisabled,
    allOwnedWalletsDisabled,
    watchedWallets,
    ownedWallets,
  } = useMemo(() => {
    const ownedWallets = notificationSettings.filter(
      (wallet: WalletNotificationSettings) =>
        wallet.type === NotificationRelationship.OWNER
    );
    const watchedWallets = notificationSettings.filter(
      (wallet: WalletNotificationSettings) =>
        wallet.type === NotificationRelationship.WATCHER
    );
    const allOwnedWalletsDisabled = ownedWallets.reduce(
      (prevWalletDisabled, wallet) => prevWalletDisabled && !wallet.enabled,
      true
    );

    const allWatchedWalletsDisabled = watchedWallets.reduce(
      (prevWalletDisabled, wallet) => prevWalletDisabled && !wallet.enabled,
      true
    );
    const lastOwnedWalletEnabled =
      ownedWallets.filter(wallet => wallet.enabled).length === 1;
    const lastWatchedWalletEnabled =
      watchedWallets.filter(wallet => wallet.enabled).length === 1;

    return {
      lastWatchedWalletEnabled,
      lastOwnedWalletEnabled,
      allWatchedWalletsDisabled,
      allOwnedWalletsDisabled,
      watchedWallets,
      ownedWallets,
    };
  }, [notificationSettings]);

  const updateGroupSettingsAndSubscriptions = useCallback(
    (type: NotificationRelationshipType, enabled: boolean) => {
      const options: GroupSettings = {
        [type]: enabled,
      };
      const newSettings: GroupSettings = {
        ...existingGroupSettings,
        ...options,
      };
      const newOwnerEnabled = newSettings[NotificationRelationship.OWNER];
      const newWatcherEnabled = newSettings[NotificationRelationship.WATCHER];

      const updateStore = () => {
        updateGroupSettings(newSettings);
      };

      if (newOwnerEnabled !== ownerEnabled) {
        return toggleGroupNotifications(
          ownedWallets,
          NotificationRelationship.OWNER,
          newOwnerEnabled
        ).then(updateStore);
      } else if (newWatcherEnabled !== watcherEnabled) {
        return toggleGroupNotifications(
          watchedWallets,
          NotificationRelationship.WATCHER,
          newWatcherEnabled
        ).then(updateStore);
      }
      return Promise.resolve();
    },
    [
      existingGroupSettings,
      ownedWallets,
      ownerEnabled,
      watchedWallets,
      watcherEnabled,
    ]
  );

  const isOwnerEnabled = useMemo(
    () => ownerEnabled && !allOwnedWalletsDisabled,
    [allOwnedWalletsDisabled, ownerEnabled]
  );
  const isWatcherEnabled = useMemo(
    () => watcherEnabled && !allWatchedWalletsDisabled,
    [allWatchedWalletsDisabled, watcherEnabled]
  );

  return {
    ownerEnabled: isOwnerEnabled,
    watcherEnabled: isWatcherEnabled,
    lastOwnedWalletEnabled,
    lastWatchedWalletEnabled,
    updateGroupSettingsAndSubscriptions,
  };
};
