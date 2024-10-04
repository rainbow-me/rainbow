import isEmpty from 'lodash/isEmpty';
import {
  DEFAULT_ENABLED_TOPIC_SETTINGS,
  WalletNotificationRelationship,
  WALLET_GROUPS_STORAGE_KEY,
} from '@/notifications/settings/constants';
import { AddressWithRelationship, WalletNotificationSettings } from '@/notifications/settings/types';
import { publishAndSaveNotificationSettings } from '@/notifications/settings/settings';
import {
  getAllGlobalNotificationSettingsFromStorage,
  getAllWalletNotificationSettingsFromStorage,
  notificationSettingsStorage,
} from '@/notifications/settings/storage';
import { InteractionManager } from 'react-native';

/**
 Checks if group notification settings are present in storage
 and adds default values for them if they do not exist.
 */
// only used during migration
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

export const subscribeExistingNotificationsSettings = () => {
  const currentSettings = getAllWalletNotificationSettingsFromStorage();
  const globalSettings = getAllGlobalNotificationSettingsFromStorage();

  if (isEmpty(currentSettings)) return;

  InteractionManager.runAfterInteractions(() => {
    publishAndSaveNotificationSettings({ globalSettings, walletSettings: currentSettings, skipPreSave: true });
  });
};

/**
 * schedules subscribing to wallets that haven't been successfully subscribed to yet
 * called from NotificationsHandler run on every cold start
 */
export const initializeNotificationSettingsForAllAddresses = (addresses: AddressWithRelationship[]) => {
  const newSettings = createInitialSettingsForAllAddresses(addresses);
  const globalSettings = getAllGlobalNotificationSettingsFromStorage();

  if (!newSettings) return;

  InteractionManager.runAfterInteractions(() => {
    publishAndSaveNotificationSettings({ globalSettings, walletSettings: newSettings });
  });
};

/**
 * Adds fresh disabled settings for all wallets that didn't have settings
 * called from createWallet and generateAccount flows
 */
export const initializeNotificationSettingsForAddresses = (addresses: AddressWithRelationship[]) => {
  const proposedSettings = createInitialSettingsForNewlyAddedAddresses(addresses);
  const globalSettings = getAllGlobalNotificationSettingsFromStorage();
  InteractionManager.runAfterInteractions(() => {
    publishAndSaveNotificationSettings({ globalSettings, walletSettings: proposedSettings });
  });
};

const createInitialSettingsForAllAddresses = (addresses: AddressWithRelationship[]) => {
  const alreadySaved = prepareSettingsRecord();
  const proposedSettings: Record<string, WalletNotificationSettings> = {};
  let needsUpdate = false;

  addresses.forEach(entry => {
    const alreadySavedEntry = alreadySaved[entry.address];
    if (alreadySavedEntry) {
      proposedSettings[entry.address] = alreadySavedEntry;
      if (!alreadySavedEntry.successfullyFinishedInitialSubscription) {
        needsUpdate = true;
      }
    } else {
      const isOwned = entry.relationship === WalletNotificationRelationship.OWNER;
      const newSettingsEntry: WalletNotificationSettings = {
        type: entry.relationship,
        address: entry.address,
        topics: isOwned ? DEFAULT_ENABLED_TOPIC_SETTINGS : {},
        enabled: isOwned,
        successfullyFinishedInitialSubscription: !isOwned,
      };
      proposedSettings[entry.address] = newSettingsEntry;
      needsUpdate = true;
    }
  });

  return needsUpdate ? Object.values(proposedSettings) : null;
};

/**
 * exported for testing only
 */
export const createInitialSettingsForNewlyAddedAddresses = (addresses: AddressWithRelationship[]) => {
  const alreadySaved = prepareSettingsRecord();
  // preparing list of wallets that need to be subscribed
  addresses.forEach(entry => {
    const alreadySavedEntry = alreadySaved[entry.address];
    // handling a case where we import a seed phrase of a previously watched wallet
    if (alreadySavedEntry !== undefined && alreadySavedEntry.type !== entry.relationship) {
      const oldSettingsEntry = alreadySavedEntry;
      const updatedSettingsEntry = {
        ...oldSettingsEntry,
        enabled: true,
        topics: DEFAULT_ENABLED_TOPIC_SETTINGS,
        type: entry.relationship,
        successfullyFinishedInitialSubscription: false,
      };
      alreadySaved[entry.address] = updatedSettingsEntry;
    } else if (!alreadySavedEntry) {
      // add new address flow
      const isOwned = entry.relationship === WalletNotificationRelationship.OWNER;
      const newSettingsEntry: WalletNotificationSettings = {
        type: entry.relationship,
        address: entry.address,
        topics: isOwned ? DEFAULT_ENABLED_TOPIC_SETTINGS : {},
        enabled: isOwned,
        successfullyFinishedInitialSubscription: !isOwned,
      };
      alreadySaved[entry.address] = newSettingsEntry;
    }
  });
  return Object.values(alreadySaved);
};

/**
 * exported for testing only
 */
export const prepareSettingsRecord = () => {
  const currentSettings = getAllWalletNotificationSettingsFromStorage();
  const alreadySaved: Record<string, WalletNotificationSettings> = currentSettings.reduce((acc, value) => {
    return {
      ...acc,
      [value.address]: value,
    };
  }, {});

  return alreadySaved;
};
