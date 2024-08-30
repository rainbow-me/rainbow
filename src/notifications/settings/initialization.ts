import {
  DEFAULT_ENABLED_TOPIC_SETTINGS,
  WalletNotificationRelationship,
  NOTIFICATIONS_DEFAULT_CHAIN_ID,
  WALLET_GROUPS_STORAGE_KEY,
} from '@/notifications/settings/constants';
import { AddressWithRelationship, WalletNotificationSettings } from '@/notifications/settings/types';
import {
  getAllGlobalNotificationSettingsFromStorage,
  getAllWalletNotificationSettingsFromStorage,
  notificationSettingsStorage,
  setAllWalletNotificationSettingsToStorage,
} from '@/notifications/settings/storage';
import { notificationsSubscription } from '@/redux/explorer';
import store from '@/redux/store';
import { subscribeWalletToAllEnabledTopics, unsubscribeWalletFromAllNotificationTopics } from '@/notifications/settings/firebase';
import { InteractionManager } from 'react-native';
import { logger, RainbowError } from '@/logger';
import { removeNotificationSettingsForWallet, toggleGlobalNotificationTopic } from '@/notifications/settings/settings';

type InitializationStateType = {
  alreadySaved: Map<string, { index: number; settings: WalletNotificationSettings }>;
  subscriptionQueue: WalletNotificationSettings[];
  newSettings: WalletNotificationSettings[];
};

/**
 Checks if group notification settings are present in storage
 and adds default values for them if they do not exist.
 */
export const addDefaultNotificationGroupSettings = (override = false) => {
  const data = notificationSettingsStorage.getString(WALLET_GROUPS_STORAGE_KEY);

  if (!data || override) {
    const defaultSettings = {
      [WalletNotificationRelationship.OWNER]: true,
      [WalletNotificationRelationship.WATCHER]: false,
    };
    notificationSettingsStorage.set(WALLET_GROUPS_STORAGE_KEY, JSON.stringify(defaultSettings));
  }
};

export const initializeGlobalNotificationSettings = () => {
  const currentSettings = getAllGlobalNotificationSettingsFromStorage();
  return Promise.all(
    Object.entries(currentSettings).map(([topic, isEnabled]) => {
      toggleGlobalNotificationTopic(topic, isEnabled);
    })
  );
};

/**
 * Adds fresh disabled settings for all wallets that didn't have settings
 * schedules subscribing to owned wallets that haven't been initialized yet
 * schedules removing settings for wallets that are no longer prersent but removal failed previously
 */
export const initializeNotificationSettingsForAllAddressesAndCleanupSettingsForRemovedWallets = (addresses: AddressWithRelationship[]) => {
  const initializationState = _prepareInitializationState();
  // Set of wallet addresses we have in app (unrelated to notification settings entries)
  const walletAddresses = new Set(addresses.map(addressWithRelationship => addressWithRelationship.address));
  const removedWalletsThatWereNotUnsubscribedProperly: string[] = [...initializationState.alreadySaved.keys()].filter(
    address => !walletAddresses.has(address)
  );

  const queue = _prepareSubscriptionQueueAndCreateInitialSettings(addresses, initializationState);

  InteractionManager.runAfterInteractions(() => {
    _processSubscriptionQueue(queue);
  });

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
export const initializeNotificationSettingsForAddresses = (addresses: AddressWithRelationship[]) => {
  const initializationState = _prepareInitializationState();

  const queue = _prepareSubscriptionQueueAndCreateInitialSettings(addresses, initializationState);

  InteractionManager.runAfterInteractions(() => {
    _processSubscriptionQueue(queue);
  });
};

/**
 * exported for testing only
 */
export const _prepareSubscriptionQueueAndCreateInitialSettings = (
  addresses: AddressWithRelationship[],
  initializationState: InitializationStateType
) => {
  const { alreadySaved, newSettings, subscriptionQueue } = initializationState;
  // preparing list of wallets that need to be subscribed
  addresses.forEach(entry => {
    store.dispatch(notificationsSubscription(entry.address));
    const alreadySavedEntry = alreadySaved.get(entry.address);
    // handling a case where we import a seed phrase of a previously watched wallet
    if (alreadySavedEntry !== undefined && alreadySavedEntry.settings.type !== entry.relationship) {
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
    // case when the wallet wasn't yet successfully initialized
    // or a wallet was imported after being watched previously and we haven't properly subscribed it yet
    else if (
      alreadySavedEntry !== undefined &&
      (alreadySavedEntry.settings?.oldType !== undefined || !alreadySavedEntry.settings.successfullyFinishedInitialSubscription)
    ) {
      subscriptionQueue.push(alreadySavedEntry.settings);
    }
    // case where there are no settings for the wallet and there will be subscriptions to process for imported wallets
    else if (!alreadySaved.has(entry.address)) {
      const isImported = entry.relationship === WalletNotificationRelationship.OWNER;
      const newSettingsEntry: WalletNotificationSettings = {
        type: entry.relationship,
        address: entry.address,
        topics: DEFAULT_ENABLED_TOPIC_SETTINGS,
        enabled: false,
        successfullyFinishedInitialSubscription: !isImported,
      };
      newSettings.push(newSettingsEntry);
      if (isImported) {
        subscriptionQueue.push(newSettingsEntry);
      }
    }
  });

  setAllWalletNotificationSettingsToStorage(newSettings);
  return subscriptionQueue;
};

/**
 * exported for testing only
 */
export const _prepareInitializationState = (): InitializationStateType => {
  const currentSettings = getAllWalletNotificationSettingsFromStorage();
  const newSettings: WalletNotificationSettings[] = [...currentSettings];
  const alreadySaved = new Map<string, { index: number; settings: WalletNotificationSettings }>();
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

/**
 * exported for testing only
 */
export const _processSubscriptionQueue = async (subscriptionQueue: WalletNotificationSettings[]): Promise<void> => {
  const results = await Promise.all(subscriptionQueue.map(item => processSubscriptionQueueItem(item)));
  const newSettings = [...getAllWalletNotificationSettingsFromStorage()];
  const settingsIndexMap = new Map<string, number>(newSettings.map((entry, index) => [entry.address, index]));
  results.forEach(result => {
    const index = settingsIndexMap.get(result.address);
    if (index !== undefined && newSettings[index] !== undefined) {
      newSettings[index] = result;
    }
  });

  setAllWalletNotificationSettingsToStorage(newSettings);
};

const processSubscriptionQueueItem = async (queueItem: WalletNotificationSettings) => {
  const newSettings = { ...queueItem };
  if (newSettings.oldType !== undefined) {
    try {
      await unsubscribeWalletFromAllNotificationTopics(newSettings.oldType, NOTIFICATIONS_DEFAULT_CHAIN_ID, newSettings.address);
      newSettings.oldType = undefined;
    } catch (e) {
      logger.error(new RainbowError('Failed to unsubscribe old watcher mode notification topics'));
    }
  }
  if (newSettings.type === WalletNotificationRelationship.OWNER && !newSettings.successfullyFinishedInitialSubscription) {
    try {
      await subscribeWalletToAllEnabledTopics(newSettings, NOTIFICATIONS_DEFAULT_CHAIN_ID);
      newSettings.successfullyFinishedInitialSubscription = true;
      newSettings.enabled = true;
    } catch (e) {
      logger.error(new RainbowError('Failed to subscribe to default notification topics for newly added wallet'));
    }
  }

  return newSettings;
};
