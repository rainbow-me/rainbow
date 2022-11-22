import {
  NotificationRelationship,
  NOTIFICATIONS_DEFAULT_CHAIN_ID,
  NotificationTopic,
  WALLET_GROUPS_STORAGE_KEY,
  WALLET_TOPICS_STORAGE_KEY,
} from '@/notifications/settings/constants';
import {
  subscribeWalletToAllNotificationTopics,
  unsubscribeWalletFromAllNotificationTopics,
} from '@/notifications/settings/settings';
import { WalletNotificationSettings } from '@/notifications/settings/types';
import Logger from 'logger';
import {
  getAllNotificationSettingsFromStorage,
  getExistingGroupSettingsFromStorage,
  notificationSettingsStorage,
  walletHasNotificationSettings,
} from '@/notifications/settings/storage';

/**
 Checks if group notification settings are present in storage
 and adds default values for them if they do not exist.
 */
export const addDefaultNotificationGroupSettings = () => {
  const data = notificationSettingsStorage.getString(WALLET_GROUPS_STORAGE_KEY);

  if (!data) {
    const defaultSettings = {
      [NotificationRelationship.OWNER]: true,
      [NotificationRelationship.WATCHER]: false,
    };
    notificationSettingsStorage.set(
      WALLET_GROUPS_STORAGE_KEY,
      JSON.stringify(defaultSettings)
    );
  }
};

/**
 1. Checks if notification settings already exist for the given address.
 2. Grabs all notification settings from storage.
 3. Appends default settings for the given address to the array.
 4. Saves the new array to storage.
 5. Subscribes the wallet to all notification topics on Firebase.
 */
export const addDefaultNotificationSettingsForWallet = (
  address: string,
  relationship: string
) => {
  const existingSettings = walletHasNotificationSettings(address);
  const defaultEnabledTopicSettings = {};
  Object.values(NotificationTopic).forEach(
    // looping through topics and setting them all as true by default
    // @ts-expect-error: Object.values() returns a string[]
    topic => (defaultEnabledTopicSettings[topic] = true)
  );

  if (!existingSettings) {
    const isOwnedWallet = relationship === NotificationRelationship.OWNER;
    const settings = getAllNotificationSettingsFromStorage();
    const groupSettings = getExistingGroupSettingsFromStorage();
    const notificationsEnabled =
      isOwnedWallet && groupSettings[NotificationRelationship.OWNER];
    const newSettings = [
      ...settings,
      {
        address,
        topics: defaultEnabledTopicSettings,
        enabled: notificationsEnabled, // turn off notifications for watched wallets by default
        type: relationship,
      },
    ];

    notificationSettingsStorage.set(
      WALLET_TOPICS_STORAGE_KEY,
      JSON.stringify(newSettings)
    );

    if (notificationsEnabled) {
      // only auto-subscribe to topics for owned wallets
      subscribeWalletToAllNotificationTopics(
        relationship,
        NOTIFICATIONS_DEFAULT_CHAIN_ID,
        address
      );
    }
  } else {
    const settings = getAllNotificationSettingsFromStorage();
    const settingsForWallet = settings.find(
      (wallet: WalletNotificationSettings) => wallet.address === address
    );

    // handle case where user imports an already watched wallet which becomes owned
    if (settingsForWallet.type !== relationship) {
      Logger.log(
        `Notifications: unsubscribing ${address} from all [${settingsForWallet.type.toUpperCase()}] notifications and subscribing to all notifications as [${relationship.toUpperCase()}]`
      );

      const settingsIndex = settings.findIndex(
        (wallet: WalletNotificationSettings) => wallet.address === address
      );

      unsubscribeWalletFromAllNotificationTopics(
        settingsForWallet.type,
        NOTIFICATIONS_DEFAULT_CHAIN_ID,
        address
      );
      subscribeWalletToAllNotificationTopics(
        relationship,
        NOTIFICATIONS_DEFAULT_CHAIN_ID,
        address
      );
      // update config for this wallet with new relationship and all topics enabled by default
      settings[settingsIndex].type = relationship;
      settings[settingsIndex].enabled = true;
      settings[settingsIndex].topics = defaultEnabledTopicSettings;

      notificationSettingsStorage.set(
        WALLET_TOPICS_STORAGE_KEY,
        JSON.stringify(settings)
      );
    }
  }
};

// Runs some MMKV operations when the app is loaded
// to ensure that settings are always present
addDefaultNotificationGroupSettings();
