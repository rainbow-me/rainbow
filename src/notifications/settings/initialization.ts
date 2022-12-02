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
import store from '@/redux/store';
import {
  subscribeWalletToAllEnabledTopics,
  unsubscribeWalletFromAllNotificationTopics,
} from '@/notifications/settings/firebase';
import { InteractionManager } from 'react-native';
import { logger, RainbowError } from '@/logger';
import { removeNotificationSettingsForWallet } from '@/notifications/settings/settings';

type InitializationStateType = {
  alreadySaved: Map<
    string,
    { index: number; settings: WalletNotificationSettings }
  >;
  subscriptionQueue: WalletNotificationSettings[];
  newSettings: WalletNotificationSettings[];
};

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
 * schedules subscribing to owned wallets that haven't been initialized yet
 * schedules removing settings for wallets that are no longer prersent but removal failed previously
 */
export const initializeNotificationSettingsForAllAddressesAndCleanupSettingsForRemovedWallets = (
  addresses: AddressWithRelationship[]
) => {
  const initializationState = makeInitializationState();
  // Set of wallet addresses we have in app (unrelated to notification settings entries)
  const walletAddresses = new Set(
    addresses.map(addressWithRelationship => addressWithRelationship.address)
  );
  const removedWalletsThatWereNotUnsubscribedProperly: string[] = [
    ...initializationState.alreadySaved.keys(),
  ].filter(address => !walletAddresses.has(address));

  internalInitializeNotificationSettingsForAddresses(
    addresses,
    initializationState
  );

  if (removedWalletsThatWereNotUnsubscribedProperly.length) {
    InteractionManager.runAfterInteractions(() => {
      removedWalletsThatWereNotUnsubscribedProperly.forEach(address => {
        removeNotificationSettingsForWallet(address);
      });
    });
  }
};

/**
 * Adds fresh disabled settings for all wallets that didn't have settings
 */
export const initializeNotificationSettingsForAddresses = (
  addresses: AddressWithRelationship[]
) => {
  const initializationState = makeInitializationState();

  internalInitializeNotificationSettingsForAddresses(
    addresses,
    initializationState
  );
};

const internalInitializeNotificationSettingsForAddresses = (
  addresses: AddressWithRelationship[],
  initializationState: InitializationStateType
) => {
  const { alreadySaved, newSettings, subscriptionQueue } = initializationState;
  // preparing list of wallets that need to be subscribed
  addresses.forEach(entry => {
    store.dispatch(notificationsSubscription(entry.address));
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
        successfullyFinishedInitialSubscription: false,
        oldType: alreadySavedEntry.settings.type,
      };
      newSettings[alreadySavedEntry.index] = updatedSettingsEntry;
      subscriptionQueue.push(updatedSettingsEntry);
    }
    // case where there's work to do on for the wallet
    else if (
      alreadySavedEntry !== undefined &&
      (alreadySavedEntry.settings?.oldType !== undefined ||
        !alreadySavedEntry.settings.successfullyFinishedInitialSubscription)
    ) {
      subscriptionQueue.push(alreadySavedEntry.settings);
    }
    // case where there are no settings for the wallet and there will be work to do
    else if (!alreadySaved.has(entry.address)) {
      const newSettingsEntry: WalletNotificationSettings = {
        type: entry.relationship,
        address: entry.address,
        topics: DEFAULT_ENABLED_TOPIC_SETTINGS,
        enabled: false,
        // Watched wallets are not automatically subscribed to topics, so they already have applied defaults
        successfullyFinishedInitialSubscription:
          entry.relationship === NotificationRelationship.WATCHER,
      };
      newSettings.push(newSettingsEntry);
      subscriptionQueue.push(newSettingsEntry);
    }
  });

  setAllNotificationSettingsToStorage(newSettings);
  InteractionManager.runAfterInteractions(() => {
    processSubscriptionQueue(subscriptionQueue);
  });
};

const makeInitializationState = (): InitializationStateType => {
  const currentSettings = getAllNotificationSettingsFromStorage();
  const newSettings: WalletNotificationSettings[] = [...currentSettings];
  const alreadySaved = new Map<
    string,
    { index: number; settings: WalletNotificationSettings }
  >();
  const subscriptionQueue: WalletNotificationSettings[] = [];

  // Initialize hashmap and a set
  newSettings.forEach((entry, index) => {
    alreadySaved.set(entry.address, { settings: entry, index });
  });

  return {
    newSettings,
    alreadySaved,
    subscriptionQueue,
  };
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
    !newSettings.successfullyFinishedInitialSubscription
  ) {
    try {
      await subscribeWalletToAllEnabledTopics(
        newSettings,
        NOTIFICATIONS_DEFAULT_CHAIN_ID
      );
      newSettings.successfullyFinishedInitialSubscription = true;
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
