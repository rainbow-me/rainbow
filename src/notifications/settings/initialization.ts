import {
  DEFAULT_ENABLED_TOPIC_SETTINGS,
  NotificationRelationship,
  WALLET_GROUPS_STORAGE_KEY,
} from '@/notifications/settings/constants';
import {
  AddressWithRelationship,
  WalletNotificationSettings,
} from '@/notifications/settings/types';
import { publishAndSaveWalletSettings } from './settings';
import {
  getAllNotificationSettingsFromStorage,
  notificationSettingsStorage,
  setAllNotificationSettingsToStorage,
} from '@/notifications/settings/storage';
import { removeNotificationSettingsForWallet } from '@/notifications/settings/settings';
import { InteractionManager } from 'react-native';

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
// only used during migration
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
 * called from NotificationsHandler run on every cold start
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

  const proposedSettings = _prepareSubscriptionQueueAndCreateInitialSettings(
    addresses,
    initializationState
  );

  InteractionManager.runAfterInteractions(() => {
    publishAndSaveWalletSettings(proposedSettings);
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
 * called from createWallet and generateAccount flows
 */
export const initializeNotificationSettingsForAddresses = (
  addresses: AddressWithRelationship[]
) => {
  const initializationState = _prepareInitializationState();

  const proposedSettings = _prepareSubscriptionQueueAndCreateInitialSettings(
    addresses,
    initializationState
  );

  InteractionManager.runAfterInteractions(() => {
    publishAndSaveWalletSettings(proposedSettings);
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
    // add new address flow
    else if (!alreadySaved.has(entry.address)) {
      const isOwned = entry.relationship === NotificationRelationship.OWNER;
      const newSettingsEntry: WalletNotificationSettings = {
        type: entry.relationship,
        address: entry.address,
        topics: DEFAULT_ENABLED_TOPIC_SETTINGS,
        enabled: isOwned,
        successfullyFinishedInitialSubscription: !isOwned,
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
