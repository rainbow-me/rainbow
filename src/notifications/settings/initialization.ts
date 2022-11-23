import {
  DEFAULT_ENABLED_TOPIC_SETTINGS,
  NotificationRelationship,
  NOTIFICATIONS_DEFAULT_CHAIN_ID,
  WALLET_GROUPS_STORAGE_KEY,
} from '@/notifications/settings/constants';
import {
  AddressWithRelationship,
  WalletNotificationSettings,
} from '@/notifications/settings/types';
import {
  getAllNotificationSettingsFromStorage,
  notificationSettingsStorage,
  setAllNotificationSettingsToStorage,
} from '@/notifications/settings/storage';
import { notificationsSubscription } from '@/redux/explorer';
import { AppDispatch } from '@/redux/store';
import {
  subscribeWalletToAllEnabledTopics,
  unsubscribeWalletFromAllNotificationTopics,
} from '@/notifications/settings/firebase';
import { InteractionManager } from 'react-native';
import { logger, RainbowError } from '@/logger';

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
 * Adds fresh disabled settings for all wallets that didn't have settings
 */
export const initializeNotificationSettingsForAddresses = (
  addresses: AddressWithRelationship[],
  dispatch: AppDispatch
) => {
  const currentSettings = getAllNotificationSettingsFromStorage();
  const newSettings: WalletNotificationSettings[] = [...currentSettings];
  const alreadySaved = new Map<
    string,
    { index: number; settings: WalletNotificationSettings }
  >();
  const alreadyAppliedDefaults = new Set();
  const subscriptionQueue: WalletNotificationSettings[] = [];

  // Initialize hashmap and a set
  newSettings.forEach((entry, index) => {
    alreadySaved.set(entry.address, { settings: entry, index });
    if (entry.appliedDefaults) {
      alreadyAppliedDefaults.add(entry.address);
    }
  });

  addresses.forEach(entry => {
    dispatch(notificationsSubscription(entry.address));
    const alreadySavedEntry = alreadySaved.get(entry.address);
    // handling a case where we import a seed phrase of a previously watched wallet
    if (
      alreadySavedEntry !== undefined &&
      alreadySavedEntry.settings.type !== entry.relationship
    ) {
      const oldSettingsEntry = newSettings[alreadySavedEntry.index];
      const updatedSettingsEntry = {
        ...oldSettingsEntry,
        topics: DEFAULT_ENABLED_TOPIC_SETTINGS,
        type: entry.relationship,
        appliedDefaults: false,
        oldType: alreadySavedEntry.settings.type,
      };
      newSettings[alreadySavedEntry.index] = updatedSettingsEntry;
      subscriptionQueue.push(updatedSettingsEntry);
    } else if (
      alreadySavedEntry !== undefined &&
      (alreadySavedEntry.settings?.oldType !== undefined ||
        !alreadySavedEntry.settings.appliedDefaults)
    ) {
      subscriptionQueue.push(alreadySavedEntry.settings);
    } else if (!alreadySaved.has(entry.address)) {
      const newSettingsEntry: WalletNotificationSettings = {
        type: entry.relationship,
        address: entry.address,
        topics: DEFAULT_ENABLED_TOPIC_SETTINGS,
        enabled: false,
        // Watched wallets are not automatically subscribed to topics, so they already have applied defaults
        appliedDefaults:
          entry.relationship === NotificationRelationship.WATCHER,
      };
      newSettings.push(newSettingsEntry);
    }
  });

  setAllNotificationSettingsToStorage(newSettings);
  InteractionManager.runAfterInteractions(() => {
    processSubscriptionQueue(subscriptionQueue);
  });
};

const processSubscriptionQueue = async (
  subscriptionQueue: WalletNotificationSettings[]
): Promise<void> => {
  const results = await Promise.all(
    subscriptionQueue.map(item => processSubscriptionQueueItem(item))
  );
  const newSettings = [...getAllNotificationSettingsFromStorage()];
  const settingsIndexMap = new Map<string, number>(
    newSettings.map((entry, index) => [entry.address, index])
  );
  results.forEach(result => {
    const index = settingsIndexMap.get(result.address);
    if (index !== undefined && newSettings[index] !== undefined) {
      newSettings[index] = result;
    }
  });

  setAllNotificationSettingsToStorage(newSettings);
};

const processSubscriptionQueueItem = async (
  queueItem: WalletNotificationSettings
) => {
  const newSettings = { ...queueItem };
  if (newSettings.oldType !== undefined) {
    try {
      await unsubscribeWalletFromAllNotificationTopics(
        newSettings.oldType,
        NOTIFICATIONS_DEFAULT_CHAIN_ID,
        newSettings.address
      );
      newSettings.oldType = undefined;
    } catch (e) {
      logger.error(
        new RainbowError(
          'Failed to unsubscribe old watcher mode notification topics'
        )
      );
    }
  }
  if (
    newSettings.type === NotificationRelationship.OWNER &&
    !newSettings.appliedDefaults
  ) {
    try {
      await subscribeWalletToAllEnabledTopics(
        newSettings,
        NOTIFICATIONS_DEFAULT_CHAIN_ID
      );
      newSettings.appliedDefaults = true;
      newSettings.enabled = true;
    } catch (e) {
      logger.error(
        new RainbowError(
          'Failed to subscribe to default notification topics for newly added wallet'
        )
      );
    }
  }

  return newSettings;
};
// Runs some MMKV operations when the app is loaded
// to ensure that settings are always present
addDefaultNotificationGroupSettings();
