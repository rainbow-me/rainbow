import {
  DEFAULT_ENABLED_TOPIC_SETTINGS,
  NotificationRelationship,
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
import { removeNotificationSettingsForWallet } from '@/notifications/settings/settings';
import { InteractionManager } from 'react-native';
import { updateWalletSettings } from './firebase';

type InitializationStateType = {
  alreadySaved: Map<
    string,
    { index: number; settings: WalletNotificationSettings }
  >;
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
  const initializationState = _prepareInitializationState();
  // Set of wallet addresses we have in app (unrelated to notification settings entries)
  const walletAddresses = new Set(
    addresses.map(addressWithRelationship => addressWithRelationship.address)
  );
  const removedWalletsThatWereNotUnsubscribedProperly: string[] = [
    ...initializationState.alreadySaved.keys(),
  ].filter(address => !walletAddresses.has(address));

  const newSettings = _prepareSubscriptionQueueAndCreateInitialSettings(
    addresses,
    initializationState
  );

  InteractionManager.runAfterInteractions(() => {
    _processSubscriptionQueue(newSettings);
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
export const initializeNotificationSettingsForAddresses = (
  addresses: AddressWithRelationship[]
) => {
  const initializationState = _prepareInitializationState();

  const newSettings = _prepareSubscriptionQueueAndCreateInitialSettings(
    addresses,
    initializationState
  );

  InteractionManager.runAfterInteractions(() => {
    _processSubscriptionQueue(newSettings);
  });
};

/**
 * exported for testing only
 */
export const _prepareSubscriptionQueueAndCreateInitialSettings = (
  addresses: AddressWithRelationship[],
  initializationState: InitializationStateType
) => {
  const { alreadySaved, newSettings } = initializationState;
  // preparing list of wallets that need to be subscribed
  addresses.forEach(entry => {
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
      };
      newSettings[alreadySavedEntry.index] = updatedSettingsEntry;
    }
    // case where there are no settings for the wallet and there will be subscriptions to process for imported wallets
    else if (!alreadySaved.has(entry.address)) {
      const isImported = entry.relationship === NotificationRelationship.OWNER;
      const newSettingsEntry: WalletNotificationSettings = {
        type: entry.relationship,
        address: entry.address,
        topics: DEFAULT_ENABLED_TOPIC_SETTINGS,
        enabled: false,
        successfullyFinishedInitialSubscription: !isImported,
      };
      newSettings.push(newSettingsEntry);
    }
  });
  setAllNotificationSettingsToStorage(newSettings);
  return newSettings;
};

/**
 * exported for testing only
 */
export const _prepareInitializationState = (): InitializationStateType => {
  const currentSettings = getAllNotificationSettingsFromStorage();
  const newSettings: WalletNotificationSettings[] = [...currentSettings];
  const alreadySaved = new Map<
    string,
    { index: number; settings: WalletNotificationSettings }
  >();

  // Initialize hashmap and a set
  newSettings.forEach((entry, index) => {
    alreadySaved.set(entry.address, { settings: entry, index });
  });

  return {
    newSettings,
    alreadySaved,
  };
};

/**
 * exported for testing only
 */
export const _processSubscriptionQueue = async (
  walletSettings: WalletNotificationSettings[]
): Promise<void> => {
  const newSettings = await updateWalletSettings(walletSettings);
  if (newSettings) {
    setAllNotificationSettingsToStorage(newSettings);
  }
};
