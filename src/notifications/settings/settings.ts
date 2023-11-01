import {
  NotificationTopicType,
  WalletNotificationSettings,
} from '@/notifications/settings/types';
import {
  getAllNotificationSettingsFromStorage,
  setAllNotificationSettingsToStorage,
} from '@/notifications/settings/storage';
import { updateWalletSettings } from '@/notifications/settings/firebase';

/**
 1. Reads notification settings for all wallets from storage.
 2. Matches settings for the wallet with the given address.
 3. Excludes that wallet from the array and saves the new array.
 4. Updates the notification subscription
 */
export const removeNotificationSettingsForWallet = async (
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

  updateWalletSettings(newSettings);
  setAllNotificationSettingsToStorage(newSettings);
};

/**
 Function for enabling/disabling all notifications for a group of wallets.
 Also used to batch toggle notifications for a single wallet
 when using the `Allow Notifications` switch in the wallet settings view.
 */
export async function toggleGroupNotifications(
  wallets: WalletNotificationSettings[],
  enableNotifications: boolean
) {
  const allSettings = getAllNotificationSettingsFromStorage();
  if (enableNotifications) {
    const toBeUpdated = new Map<string, boolean>();
    // Initialize hashmap of addresses to be enabled
    wallets.forEach((entry, _) => {
      toBeUpdated.set(entry.address, true);
    });

    const newSettings = allSettings.map(walletSetting => {
      if (toBeUpdated.get(walletSetting.address)) {
        return {
          ...walletSetting,
          enabled: true,
        };
      }
      return walletSetting;
    });

    updateWalletSettings(newSettings);
  } else {
    // unsubscribe from all topics for all wallets passed in
    const toBeRemoved = new Map<string, boolean>();

    // Initialize hashmap of addresses to be removed
    wallets.forEach((entry, _) => {
      toBeRemoved.set(entry.address, true);
    });

    const newSettings = allSettings.filter(
      (wallet: WalletNotificationSettings) => !toBeRemoved.get(wallet.address)
    );

    updateWalletSettings(newSettings);
  }
}

/**
 Function for subscribing/unsubscribing a wallet to/from a single notification topic.
 */
export async function toggleTopicForWallet(
  address: string,
  topic: NotificationTopicType,
  enableTopic: boolean
) {
  const allSettings = getAllNotificationSettingsFromStorage();
  const newSettings = allSettings.map(walletSetting => {
    if (walletSetting.address !== address) {
      return walletSetting;
    }
    return {
      ...walletSetting,
      topics: {
        ...walletSetting.topics,
        [topic]: enableTopic,
      },
    };
  });
  updateWalletSettings(newSettings);
}
