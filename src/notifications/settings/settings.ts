import { DEFAULT_ENABLED_TOPIC_SETTINGS } from '@/notifications/settings/constants';
import {
  NotificationTopicType,
  WalletNotificationSettings,
} from '@/notifications/settings/types';
import {
  getAllNotificationSettingsFromStorage,
  setAllNotificationSettingsToStorage,
} from '@/notifications/settings/storage';
import { publishWalletSettings } from '@/notifications/settings/firebase';

/**
 1. Reads notification settings for all wallets from storage.
 2. Matches settings for the wallet with the given address.
 3. Excludes that wallet from the array and saves the new array.
 4. Updates the notification subscription
 */
export const removeNotificationSettingsForWallet = async (address: string) => {
  const allSettings = getAllNotificationSettingsFromStorage();
  const settingsForWallet = allSettings.find(
    (wallet: WalletNotificationSettings) => wallet.address === address
  );

  if (!settingsForWallet) {
    return;
  }

  const newSettings = allSettings.filter(
    (wallet: WalletNotificationSettings) => wallet.address !== address
  );

  publishAndSaveWalletSettings(newSettings);
};

/**
 Function for enabling/disabling all notifications for a group of wallets.
 Also used to batch toggle notifications for a single wallet
 when using the `Allow Notifications` switch in the wallet settings view.
 */
export async function toggleGroupNotifications(
  wallets: WalletNotificationSettings[],
  enableNotifications: boolean
): Promise<boolean> {
  const allSettings = getAllNotificationSettingsFromStorage();
  const toBeUpdated = new Map<string, boolean>();
  wallets.forEach(entry => {
    toBeUpdated.set(entry.address, true);
  });

  const proposedSettings = allSettings.map(walletSetting => {
    if (toBeUpdated.get(walletSetting.address)) {
      return {
        ...walletSetting,
        enabled: enableNotifications,
        successfullyFinishedInitialSubscription: false,
        topics: enableNotifications ? DEFAULT_ENABLED_TOPIC_SETTINGS : {},
      };
    }
    return walletSetting;
  });

  return publishAndSaveWalletSettings(proposedSettings, true);
}

/**
 Function for subscribing/unsubscribing a wallet to/from a single notification topic.
 */
export async function toggleTopicForWallet(
  address: string,
  topic: NotificationTopicType,
  enableTopic: boolean
): Promise<boolean> {
  const allSettings = getAllNotificationSettingsFromStorage();
  const newSettings = allSettings.map(walletSetting => {
    if (walletSetting.address !== address) {
      return walletSetting;
    }
    return {
      ...walletSetting,
      successfullyFinishedInitialSubscription: false,
      topics: {
        ...walletSetting.topics,
        [topic]: enableTopic,
      },
    };
  });
  return publishAndSaveWalletSettings(newSettings, true);
}

export const publishAndSaveWalletSettings = async (
  proposedSettings: WalletNotificationSettings[],
  skipPreSave: boolean = false
): Promise<boolean> => {
  if (!skipPreSave) {
    setAllNotificationSettingsToStorage(proposedSettings);
  }
  const finalizedSettings = await publishWalletSettings(proposedSettings);
  if (finalizedSettings) {
    setAllNotificationSettingsToStorage(finalizedSettings);
    return true;
  }
  return false;
};
