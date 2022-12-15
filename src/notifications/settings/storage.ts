import {
  WALLET_GROUPS_STORAGE_KEY,
  WALLET_TOPICS_STORAGE_KEY,
} from '@/notifications/settings/constants';
import {
  GroupSettings,
  NotificationRelationshipType,
  WalletNotificationSettings,
} from '@/notifications/settings/types';
import { MMKV } from 'react-native-mmkv';
import { STORAGE_IDS } from '@/model/mmkv';

export const notificationSettingsStorage = new MMKV({
  id: STORAGE_IDS.NOTIFICATIONS,
});

/**
 Grabs notification settings for all wallets if they exist,
 otherwise returns an empty array.
 */
export const getAllNotificationSettingsFromStorage = () => {
  const data = notificationSettingsStorage.getString(WALLET_TOPICS_STORAGE_KEY);

  if (data) return JSON.parse(data) as WalletNotificationSettings[];
  return [];
};

/**
 * Grabs notification settings for wallet with a given address if it exists
 */
export const getNotificationSettingsForWalletWithAddress = (
  address: string
) => {
  const allSettings = getAllNotificationSettingsFromStorage();
  return allSettings.find(
    (wallet: WalletNotificationSettings) => wallet.address === address
  );
};

/**
 * Writes an updated settings object to storage
 */
export const setAllNotificationSettingsToStorage = (
  settings: WalletNotificationSettings[]
) => {
  notificationSettingsStorage.set(
    WALLET_TOPICS_STORAGE_KEY,
    JSON.stringify(settings)
  );
};

export const getExistingGroupSettingsFromStorage = () => {
  const data = notificationSettingsStorage.getString(WALLET_GROUPS_STORAGE_KEY);

  if (data) return JSON.parse(data) as GroupSettings;
  return {};
};

/**
 * Updates settings for all wallets with relationship type
 * @returns updated wallet settings array
 */
export const updateSettingsForWalletsWithRelationshipType = (
  type: NotificationRelationshipType,
  options: Partial<WalletNotificationSettings>
): WalletNotificationSettings[] => {
  const data = getAllNotificationSettingsFromStorage();
  const newSettings = data.map((wallet: WalletNotificationSettings) => {
    if (wallet.type === type) {
      return { ...wallet, ...options };
    }
    return wallet;
  });
  notificationSettingsStorage.set(
    WALLET_TOPICS_STORAGE_KEY,
    JSON.stringify(newSettings)
  );

  return newSettings;
};

/**
 * Updates settings for wallet with address
 * @returns updated wallet settings object or undefined if there's no wallet with passed address
 */
export const updateSettingsForWalletWithAddress = (
  address: string,
  options: Partial<WalletNotificationSettings>
): WalletNotificationSettings | undefined => {
  let updatedSettings: WalletNotificationSettings | undefined = undefined;
  const data = getAllNotificationSettingsFromStorage();
  const newSettings = data.map((wallet: WalletNotificationSettings) => {
    if (wallet.address === address) {
      updatedSettings = { ...wallet, ...options };
      return updatedSettings;
    }
    return wallet;
  });
  notificationSettingsStorage.set(
    WALLET_TOPICS_STORAGE_KEY,
    JSON.stringify(newSettings)
  );

  return updatedSettings;
};

/**
 * Updates group settings by passing full or partial group settings object
 * @returns updated group settings object
 */
export const updateGroupSettings = (options: GroupSettings): GroupSettings => {
  const existingGroupSettings = getExistingGroupSettingsFromStorage();
  const newSettings: GroupSettings = {
    ...existingGroupSettings,
    ...options,
  };

  notificationSettingsStorage.set(
    WALLET_GROUPS_STORAGE_KEY,
    JSON.stringify(newSettings)
  );

  return newSettings;
};
