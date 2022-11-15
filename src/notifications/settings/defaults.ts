import {
  DEFAULT_ENABLED_TOPIC_SETTINGS,
  NotificationRelationship,
  NOTIFICATIONS_DEFAULT_CHAIN_ID,
  WALLET_GROUPS_STORAGE_KEY,
  WALLET_TOPICS_STORAGE_KEY,
} from '@/notifications/settings/constants';
import {
  subscribeWalletToAllNotificationTopics,
  unsubscribeWalletFromAllNotificationTopics,
} from '@/notifications/settings/settings';
import {
  AddressWithRelationship,
  GroupSettings,
  NotificationRelationshipType,
  WalletNotificationSettings,
} from '@/notifications/settings/types';
import Logger from 'logger';
import {
  getAllNotificationSettingsFromStorage,
  getExistingGroupSettingsFromStorage,
  notificationSettingsStorage,
  walletHasNotificationSettings,
} from '@/notifications/settings/storage';
import { notificationsSubscription } from '@/redux/explorer';
import { AppDispatch } from '@/redux/store';

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

export const initializeAllWalletsWithDefaults = (
  addresses: AddressWithRelationship[],
  dispatch: AppDispatch
): Promise<void> => {
  const currentSettings = getAllNotificationSettingsFromStorage();
  const currentGroups = getExistingGroupSettingsFromStorage();
  const newSettings = [...currentSettings];
  // This map is used in order to optimize the time complexity of initialization
  const walletSettingsMap = new Map<
    string,
    { settings: WalletNotificationSettings; index: number }
  >(
    newSettings.map((walletSettings, index) => [
      walletSettings.address,
      { settings: walletSettings, index },
    ])
  );
  const subscriptionsQueue: Array<{
    settings: WalletNotificationSettings;
    // used for case where we need to resubscribe a wallet
    oldRelationship?: NotificationRelationshipType;
  }> = [];

  addresses.forEach(({ address, relationship }) => {
    dispatch(notificationsSubscription(address));
    const walletEntry = walletSettingsMap.get(address);

    if (walletEntry === undefined) {
      const isOwnedWallet = relationship === NotificationRelationship.OWNER;
      const notificationsEnabled =
        isOwnedWallet && currentGroups[NotificationRelationship.OWNER];
      const settingsToAdd: WalletNotificationSettings = {
        address,
        topics: DEFAULT_ENABLED_TOPIC_SETTINGS,
        enabled: notificationsEnabled, // turn off notifications for watched wallets by default
        type: relationship,
      };
      newSettings.push(settingsToAdd);
      subscriptionsQueue.push({
        settings: settingsToAdd,
      });

      // handle a case where user imports an already watched wallet which becomes owned
    } else if (walletEntry.settings.type !== relationship) {
      Logger.log(
        `Notifications: unsubscribing ${address} from all [${walletEntry.settings.type.toUpperCase()}] notifications and subscribing to all notifications as [${relationship.toUpperCase()}]`
      );
      const index = walletEntry.index;
      newSettings[index].type = relationship;
      newSettings[index].enabled = true;
      newSettings[index].topics = DEFAULT_ENABLED_TOPIC_SETTINGS;
      subscriptionsQueue.push({
        settings: { ...walletEntry.settings, type: relationship },
        oldRelationship: walletEntry.settings.type,
      });
    }
  });

  return Promise.all(
    subscriptionsQueue.map(item => {
      if (item.oldRelationship !== undefined) {
        return unsubscribeWalletFromAllNotificationTopics(
          item.oldRelationship,
          NOTIFICATIONS_DEFAULT_CHAIN_ID,
          item.settings.address
        ).then(() =>
          subscribeWalletToAllNotificationTopics(
            item.settings.type,
            NOTIFICATIONS_DEFAULT_CHAIN_ID,
            item.settings.address
          )
        );
      } else {
        return subscribeWalletToAllNotificationTopics(
          item.settings.type,
          NOTIFICATIONS_DEFAULT_CHAIN_ID,
          item.settings.address
        );
      }
    })
  ).then(() => {
    notificationSettingsStorage.set(
      WALLET_TOPICS_STORAGE_KEY,
      JSON.stringify(newSettings)
    );
  });
};

/**
 1. Checks if notification settings already exist for the given address.
 2. Grabs all notification settings from storage.
 3. Appends default settings for the given address to the array.
 4. Saves the new array to storage.
 5. Subscribes the wallet to all notification topics on Firebase.
 */
export const addDefaultNotificationSettingsForWallet = async (
  address: string,
  relationship: string
) => {
  if (!walletHasNotificationSettings(address)) {
    const isOwnedWallet = relationship === NotificationRelationship.OWNER;
    const settings = getAllNotificationSettingsFromStorage();
    const groupSettings = getExistingGroupSettingsFromStorage();
    const notificationsEnabled =
      isOwnedWallet && groupSettings[NotificationRelationship.OWNER];
    const newSettings = [
      ...settings,
      {
        address,
        topics: DEFAULT_ENABLED_TOPIC_SETTINGS,
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

    if (!settingsForWallet) return;

    // handle a case where user imports an already watched wallet which becomes owned
    if (settingsForWallet.type !== relationship) {
      Logger.log(
        `Notifications: unsubscribing ${address} from all [${settingsForWallet.type.toUpperCase()}] notifications and subscribing to all notifications as [${relationship.toUpperCase()}]`
      );

      const settingsIndex = settings.findIndex(
        (wallet: WalletNotificationSettings) => wallet.address === address
      );

      await unsubscribeWalletFromAllNotificationTopics(
        settingsForWallet.type,
        NOTIFICATIONS_DEFAULT_CHAIN_ID,
        address
      );
      await subscribeWalletToAllNotificationTopics(
        relationship,
        NOTIFICATIONS_DEFAULT_CHAIN_ID,
        address
      );
      // update config for this wallet with new relationship and all topics enabled by default
      settings[settingsIndex].type = relationship;
      settings[settingsIndex].enabled = true;
      settings[settingsIndex].topics = DEFAULT_ENABLED_TOPIC_SETTINGS;

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
