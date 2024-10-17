import { DEFAULT_ENABLED_TOPIC_SETTINGS } from '@/notifications/settings/constants';
import {
  GlobalNotificationTopics,
  GlobalNotificationTopicType,
  WalletNotificationTopicType,
  WalletNotificationSettings,
} from '@/notifications/settings/types';
import {
  getAllGlobalNotificationSettingsFromStorage,
  getAllWalletNotificationSettingsFromStorage,
  setAllWalletNotificationSettingsToStorage,
} from '@/notifications/settings/storage';
import { trackChangedGlobalNotificationSettings } from '@/notifications/analytics';

import { publishWalletSettings } from '@/notifications/settings/firebase';

/**
 1. Reads notification settings for all wallets from storage.
 2. Matches settings for the wallet with the given address.
 3. Excludes that wallet from the array and saves the new array.
 4. Updates the notification subscription
 */
export const removeNotificationSettingsForWallet = async (address: string): Promise<void> => {
  const walletSettings = getAllWalletNotificationSettingsFromStorage();
  const globalSettings = getAllGlobalNotificationSettingsFromStorage();
  const settingsForWallet = walletSettings.find(
    (wallet: WalletNotificationSettings) => wallet.address.toLowerCase() === address.toLowerCase()
  );

  if (!settingsForWallet) {
    return;
  }

  const newWalletSettings = walletSettings.filter(
    (wallet: WalletNotificationSettings) => wallet.address.toLowerCase() !== address.toLowerCase()
  );

  publishAndSaveNotificationSettings({ globalSettings, walletSettings: newWalletSettings });
};

/**
 Function for enabling/disabling all notifications for a group of wallets.
 Also used to batch toggle notifications for a single wallet
 when using the `Allow Notifications` switch in the wallet settings view.
 */
export async function toggleGroupNotifications(
  walletNotificationSettingsToUpdate: WalletNotificationSettings[],
  enableNotifications: boolean
): Promise<boolean> {
  const walletSettings = getAllWalletNotificationSettingsFromStorage();
  const globalSettings = getAllGlobalNotificationSettingsFromStorage();
  const toBeUpdated = new Map<string, boolean>();
  walletNotificationSettingsToUpdate.forEach(entry => {
    toBeUpdated.set(entry.address, true);
  });

  const proposedWalletSettings = walletSettings.map(walletSetting => {
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

  return publishAndSaveNotificationSettings({ globalSettings, walletSettings: proposedWalletSettings, skipPreSave: true });
}

/**
 Function for subscribing/unsubscribing a wallet to/from a single notification topic.
 */
export async function toggleTopicForWallet(address: string, topic: WalletNotificationTopicType, enableTopic: boolean): Promise<boolean> {
  const walletSettings = getAllWalletNotificationSettingsFromStorage();
  const globalSettings = getAllGlobalNotificationSettingsFromStorage();
  const newSettings = walletSettings.map(walletSetting => {
    if (walletSetting.address.toLowerCase() !== address.toLowerCase()) {
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
  return publishAndSaveNotificationSettings({ globalSettings, walletSettings: newSettings, skipPreSave: true });
}

/**
 Function for subscribing/unsubscribing the app to/from a global notification topic.
 */
export const toggleGlobalNotificationTopic = async (topic: GlobalNotificationTopicType, enableTopic: boolean): Promise<boolean> => {
  const walletSettings = getAllWalletNotificationSettingsFromStorage();
  const currentGlobalSettings = getAllGlobalNotificationSettingsFromStorage();
  const globalSettings = {
    ...currentGlobalSettings,
    [topic]: enableTopic,
  };
  const success = await publishAndSaveNotificationSettings({ globalSettings, walletSettings });
  if (success) trackChangedGlobalNotificationSettings(topic, enableTopic);
  return success;
};

// used only for DevSection clearing of storage
export const unsubscribeAllNotifications = () => {
  return publishAndSaveNotificationSettings({
    globalSettings: {},
    walletSettings: [],
    skipPreSave: true,
  });
};

export const publishAndSaveNotificationSettings = async ({
  globalSettings,
  walletSettings,
  skipPreSave = false,
}: {
  globalSettings: GlobalNotificationTopics;
  walletSettings: WalletNotificationSettings[];
  skipPreSave?: boolean;
}): Promise<boolean> => {
  if (!skipPreSave) {
    setAllWalletNotificationSettingsToStorage(walletSettings);
  }
  const finalizedSettings = await publishWalletSettings({ globalSettings, walletSettings });
  if (finalizedSettings) {
    setAllWalletNotificationSettingsToStorage(finalizedSettings);
    return true;
  }
  return false;
};
