import {
  DEFAULT_ENABLED_GLOBAL_TOPIC_SETTINGS,
  NOTIFICATIONS_DEFAULT_CHAIN_ID,
  WALLET_TOPICS_STORAGE_KEY,
} from '@/notifications/settings/constants';
import {
  GlobalNotificationTopicType,
  WalletNotificationRelationshipType,
  WalletNotificationTopicType,
  WalletNotificationSettings,
} from '@/notifications/settings/types';
import {
  getAllWalletNotificationSettingsFromStorage,
  notificationSettingsStorage,
  setAllGlobalNotificationSettingsToStorage,
} from '@/notifications/settings/storage';
import {
  subscribeToGlobalNotificationTopic,
  subscribeWalletToNotificationTopic,
  unsubscribeFromAllGlobalNotificationTopics,
  unsubscribeFromGlobalNotificationTopic,
  unsubscribeWalletFromAllNotificationTopics,
  unsubscribeWalletFromNotificationTopic,
} from '@/notifications/settings/firebase';

export const removeGlobalNotificationSettings = (): Promise<void> => {
  return unsubscribeFromAllGlobalNotificationTopics().then(() =>
    setAllGlobalNotificationSettingsToStorage(DEFAULT_ENABLED_GLOBAL_TOPIC_SETTINGS)
  );
};

/**
 1. Reads notification settings for all wallets from storage.
 2. Matches settings for the wallet with the given address.
 3. Excludes that wallet from the array and saves the new array.
 4. Unsubscribes the wallet from all notification topics on Firebase.
 */
export const removeNotificationSettingsForWallet = (address: string): Promise<void> => {
  const allSettings = getAllWalletNotificationSettingsFromStorage();
  const settingsForWallet = allSettings.find((wallet: WalletNotificationSettings) => wallet.address === address);

  if (!settingsForWallet) {
    return Promise.resolve();
  }

  const newSettings = allSettings.filter((wallet: WalletNotificationSettings) => wallet.address !== address);

  return unsubscribeWalletFromAllNotificationTopics(settingsForWallet.type, NOTIFICATIONS_DEFAULT_CHAIN_ID, address).then(() => {
    notificationSettingsStorage.set(WALLET_TOPICS_STORAGE_KEY, JSON.stringify(newSettings));
  });
};

/**
 Function for enabling/disabling all notifications for a group of wallets.
 Also used to batch toggle notifications for a single wallet
 when using the `Allow Notifications` switch in the wallet settings view.
 */
export function toggleGroupNotifications(
  wallets: WalletNotificationSettings[],
  relationship: WalletNotificationRelationshipType,
  enableNotifications: boolean
): Promise<void[][] | void[]> {
  if (enableNotifications) {
    return Promise.all(
      // loop through all owned wallets, loop through their topics, subscribe to enabled topics
      wallets.flatMap((wallet: WalletNotificationSettings) => {
        const { topics, address } = wallet;
        // when toggling a whole group, check if notifications
        // are specifically enabled for this wallet
        return Object.keys(topics).map((topic: WalletNotificationTopicType) => {
          if (topics[topic]) {
            return subscribeWalletToNotificationTopic(relationship, NOTIFICATIONS_DEFAULT_CHAIN_ID, address, topic);
          } else {
            return Promise.resolve();
          }
        });
      })
    );
  } else {
    // loop through all owned wallets, unsubscribe from all topics
    return Promise.all(
      wallets.map((wallet: WalletNotificationSettings) => {
        return unsubscribeWalletFromAllNotificationTopics(relationship, NOTIFICATIONS_DEFAULT_CHAIN_ID, wallet.address);
      })
    );
  }
}

/**
 Function for subscribing/unsubscribing a wallet to/from a single notification topic.
 */
export function toggleTopicForWallet(
  relationship: WalletNotificationRelationshipType,
  address: string,
  topic: WalletNotificationTopicType,
  enableTopic: boolean
): Promise<void> {
  if (enableTopic) {
    return subscribeWalletToNotificationTopic(relationship, NOTIFICATIONS_DEFAULT_CHAIN_ID, address, topic);
  } else {
    return unsubscribeWalletFromNotificationTopic(relationship, NOTIFICATIONS_DEFAULT_CHAIN_ID, address, topic);
  }
}

/**
 Function for subscribing/unsubscribing the app to/from a single notification topic.
 */
export function toggleGlobalNotificationTopic(topic: GlobalNotificationTopicType, enableTopic: boolean): Promise<void> {
  if (enableTopic) {
    return subscribeToGlobalNotificationTopic(topic);
  } else {
    return unsubscribeFromGlobalNotificationTopic(topic);
  }
}
