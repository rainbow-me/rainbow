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
} from '@/notifications/settings/storage';

/**
 Hook for getting and setting notification settings for a single wallet.

 Returns an object with the wallet address, enabled/disabled topics, relationship,
 and a main boolean for enabling/disabling all notifications for this wallet.

 Also returns a function for updating settings.
 The function saves new option values to storage and handles
 subscribing/unsubscribing to Firebase based on selected topics for this wallet.
 */
export const useNotificationSettings = (address: string) => {
  const data = getAllNotificationSettingsFromStorage();
  const settingsForWallet = data.find(
    (wallet: WalletNotificationSettings) => wallet.address === address
  );
  const [
    notifications,
    setNotificationSettings,
  ] = useState<WalletNotificationSettings>(settingsForWallet);

  const updateSettings = useCallback(
    (options: object) => {
      const newSettings = data.map((wallet: WalletNotificationSettings) => {
        if (wallet.address === address) {
          return { ...wallet, ...options };
        }
        return wallet;
      });
      const newSettingsForWallet = newSettings.find(
        (wallet: WalletNotificationSettings) => wallet.address === address
      );
      notificationSettingsStorage.set(
        WALLET_TOPICS_STORAGE_KEY,
        JSON.stringify(newSettings)
      );
      setNotificationSettings(newSettingsForWallet);
    },
    [address, data]
  );

  return { notifications, updateSettings };
};

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

  const updateSectionSettings = useCallback(
    (options: object) => {
      const newSettings = { ...existingGroupSettings, ...options };
      notificationSettingsStorage.set(
        WALLET_GROUPS_STORAGE_KEY,
        JSON.stringify(newSettings)
      );
    },
    [existingGroupSettings]
  );

  const updateGroupSettings = useCallback(
    (type: NotificationRelationshipType, enabled: boolean) => {
      const options = {
        [type]: enabled,
      };
      const newSettings = { ...existingGroupSettings, ...options };
      const newOwnerEnabled = newSettings[NotificationRelationship.OWNER];
      const newWatcherEnabled = newSettings[NotificationRelationship.WATCHER];

      const updatedStore = () => {
        notificationSettingsStorage.set(
          WALLET_GROUPS_STORAGE_KEY,
          JSON.stringify(newSettings)
        );
      };

      if (newOwnerEnabled !== ownerEnabled) {
        return toggleGroupNotifications(
          ownedWallets,
          NotificationRelationship.OWNER,
          newOwnerEnabled
        ).then(updatedStore);
      } else if (newWatcherEnabled !== watcherEnabled) {
        return toggleGroupNotifications(
          watchedWallets,
          NotificationRelationship.WATCHER,
          newWatcherEnabled
        ).then(updatedStore);
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
    updateGroupSettings,
    updateSectionSettings,
  };
};
