import {
  NOTIFICATIONS_DEFAULT_CHAIN_ID,
  WALLET_TOPICS_STORAGE_KEY,
} from '@/notifications/settings/constants';
import {
  NotificationRelationshipType,
  NotificationTopicType,
  WalletNotificationSettings,
} from '@/notifications/settings/types';
import {
  getAllNotificationSettingsFromStorage,
  notificationSettingsStorage,
} from '@/notifications/settings/storage';
import {
  subscribeWalletToSingleNotificationTopic,
  unsubscribeWalletFromAllNotificationTopics,
  unsubscribeWalletFromSingleNotificationTopic,
} from '@/notifications/settings/firebase';

/**
 1. Reads notification settings for all wallets from storage.
 2. Matches settings for the wallet with the given address.
 3. Excludes that wallet from the array and saves the new array.
 4. Unsubscribes the wallet from all notification topics on Firebase.
 */
export const removeNotificationSettingsForWallet = (
  address: string
): Promise<void> => {
  const allSettings = getAllNotificationSettingsFromStorage();
  const settingsForWallet = allSettings.find(
    (wallet: WalletNotificationSettings) => wallet.address === address
  );

  if (!settingsForWallet) {
    return Promise.resolve();
  }

  const newSettings = allSettings.filter(
    (wallet: WalletNotificationSettings) => wallet.address !== address
  );

  return unsubscribeWalletFromAllNotificationTopics(
    settingsForWallet.type,
    NOTIFICATIONS_DEFAULT_CHAIN_ID,
    address
  ).then(() => {
    notificationSettingsStorage.set(
      WALLET_TOPICS_STORAGE_KEY,
      JSON.stringify(newSettings)
    );
  });
};

/**
 Function for enabling/disabling all notifications for a group of wallets.
 Also used to batch toggle notifications for a single wallet
 when using the `Allow Notifications` switch in the wallet settings view.
 */
export function toggleGroupNotifications(
  wallets: WalletNotificationSettings[],
  relationship: NotificationRelationshipType,
  enableNotifications: boolean
): Promise<void[][] | void[]> {
  if (enableNotifications) {
    return Promise.all(
      // loop through all owned wallets, loop through their topics, subscribe to enabled topics
      wallets.flatMap((wallet: WalletNotificationSettings) => {
        const { topics, address } = wallet;
        // when toggling a whole group, check if notifications
        // are specifically enabled for this wallet
        return Object.keys(topics).map((topic: NotificationTopicType) => {
          if (topics[topic]) {
            return subscribeWalletToSingleNotificationTopic(
              relationship,
              NOTIFICATIONS_DEFAULT_CHAIN_ID,
              address,
              topic
            );
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
        return unsubscribeWalletFromAllNotificationTopics(
          relationship,
          NOTIFICATIONS_DEFAULT_CHAIN_ID,
          wallet.address
        );
      })
    );
  }
}

/**
 Function for subscribing/unsubscribing a wallet to/from a single notification topic.
 */
export function toggleTopicForWallet(
  relationship: NotificationRelationshipType,
  address: string,
  topic: NotificationTopicType,
  enableTopic: boolean
): Promise<void> {
  if (enableTopic) {
    return subscribeWalletToSingleNotificationTopic(
      relationship,
      NOTIFICATIONS_DEFAULT_CHAIN_ID,
      address,
      topic
    );
  } else {
    return unsubscribeWalletFromSingleNotificationTopic(
      relationship,
      NOTIFICATIONS_DEFAULT_CHAIN_ID,
      address,
      topic
    );
  }
}
