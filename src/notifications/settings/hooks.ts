import {
  GlobalNotificationTopics,
  GroupSettings,
  WalletNotificationRelationshipType,
  WalletNotificationSettings,
} from '@/notifications/settings/types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  GLOBAL_TOPICS_STORAGE_KEY,
  WalletNotificationRelationship,
  WALLET_GROUPS_STORAGE_KEY,
  WALLET_TOPICS_STORAGE_KEY,
} from '@/notifications/settings/constants';
import { toggleGroupNotifications } from '@/notifications/settings/settings';
import {
  getAllGlobalNotificationSettingsFromStorage,
  getAllWalletNotificationSettingsFromStorage,
  getExistingGroupSettingsFromStorage,
  notificationSettingsStorage,
  updateGroupSettings,
} from '@/notifications/settings/storage';

/**
 Hook to constantly listen to notification settings.
 */
export const useAllNotificationSettingsFromStorage = () => {
  const walletNotificationSettingsData = getAllWalletNotificationSettingsFromStorage();
  const globalNotificationSettingsData = getAllGlobalNotificationSettingsFromStorage();
  const existingGroupSettingsData = getExistingGroupSettingsFromStorage();

  const [walletNotificationSettings, setWalletNotificationSettings] =
    useState<WalletNotificationSettings[]>(walletNotificationSettingsData);
  const [globalNotificationSettings, setGlobalNotificationSettings] = useState<GlobalNotificationTopics>(globalNotificationSettingsData);
  const [existingGroupSettings, setExistingGroupSettings] = useState<GroupSettings>(existingGroupSettingsData);
  const listener = notificationSettingsStorage.addOnValueChangedListener(changedKey => {
    if (changedKey === WALLET_TOPICS_STORAGE_KEY) {
      const newSettings = notificationSettingsStorage.getString(changedKey);
      newSettings && setWalletNotificationSettings(JSON.parse(newSettings));
    } else if (changedKey === WALLET_GROUPS_STORAGE_KEY) {
      const newSettings = notificationSettingsStorage.getString(changedKey);
      newSettings && setExistingGroupSettings(JSON.parse(newSettings));
    } else if (changedKey === GLOBAL_TOPICS_STORAGE_KEY) {
      const newSettings = notificationSettingsStorage.getString(changedKey);
      newSettings && setGlobalNotificationSettings(JSON.parse(newSettings));
    }
  });
  useEffect(() => () => {
    listener.remove();
  });
  return {
    globalNotificationSettings,
    walletNotificationSettings,
    existingGroupSettings,
  };
};

/**
 Hook for getting and setting notification settings for all wallets
 in an owned/watched group.

 Returns a boolean for two groups: owned and watched.
 Provides a function for updating the group settings.
 */
export const useWalletGroupNotificationSettings = () => {
  const { walletNotificationSettings, existingGroupSettings } = useAllNotificationSettingsFromStorage();

  const ownerEnabled = existingGroupSettings[WalletNotificationRelationship.OWNER];
  const watcherEnabled = existingGroupSettings[WalletNotificationRelationship.WATCHER];

  const {
    lastWatchedWalletEnabled,
    lastOwnedWalletEnabled,
    allWatchedWalletsDisabled,
    allOwnedWalletsDisabled,
    watchedWallets,
    ownedWallets,
  } = useMemo(() => {
    const ownedWallets = walletNotificationSettings.filter(
      (wallet: WalletNotificationSettings) => wallet.type === WalletNotificationRelationship.OWNER
    );
    const watchedWallets = walletNotificationSettings.filter(
      (wallet: WalletNotificationSettings) => wallet.type === WalletNotificationRelationship.WATCHER
    );
    const allOwnedWalletsDisabled = ownedWallets.reduce((prevWalletDisabled, wallet) => prevWalletDisabled && !wallet.enabled, true);

    const allWatchedWalletsDisabled = watchedWallets.reduce((prevWalletDisabled, wallet) => prevWalletDisabled && !wallet.enabled, true);
    const lastOwnedWalletEnabled = ownedWallets.filter(wallet => wallet.enabled).length === 1;
    const lastWatchedWalletEnabled = watchedWallets.filter(wallet => wallet.enabled).length === 1;

    return {
      lastWatchedWalletEnabled,
      lastOwnedWalletEnabled,
      allWatchedWalletsDisabled,
      allOwnedWalletsDisabled,
      watchedWallets,
      ownedWallets,
    };
  }, [walletNotificationSettings]);

  const updateGroupSettingsAndSubscriptions = useCallback(
    (type: WalletNotificationRelationshipType, enabled: boolean) => {
      const options: GroupSettings = {
        [type]: enabled,
      };
      const newSettings: GroupSettings = {
        ...existingGroupSettings,
        ...options,
      };
      const newOwnerEnabled = newSettings[WalletNotificationRelationship.OWNER];
      const newWatcherEnabled = newSettings[WalletNotificationRelationship.WATCHER];

      const updateStore = () => {
        updateGroupSettings(newSettings);
      };

      if (newOwnerEnabled !== ownerEnabled) {
        return toggleGroupNotifications(ownedWallets, WalletNotificationRelationship.OWNER, newOwnerEnabled).then(updateStore);
      } else if (newWatcherEnabled !== watcherEnabled) {
        return toggleGroupNotifications(watchedWallets, WalletNotificationRelationship.WATCHER, newWatcherEnabled).then(updateStore);
      }
      return Promise.resolve();
    },
    [existingGroupSettings, ownedWallets, ownerEnabled, watchedWallets, watcherEnabled]
  );

  const isOwnerEnabled = useMemo(() => ownerEnabled && !allOwnedWalletsDisabled, [allOwnedWalletsDisabled, ownerEnabled]);
  const isWatcherEnabled = useMemo(() => watcherEnabled && !allWatchedWalletsDisabled, [allWatchedWalletsDisabled, watcherEnabled]);

  return {
    ownerEnabled: isOwnerEnabled,
    watcherEnabled: isWatcherEnabled,
    lastOwnedWalletEnabled,
    lastWatchedWalletEnabled,
    updateGroupSettingsAndSubscriptions,
  };
};
