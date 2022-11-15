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

export const getExistingGroupSettingsFromStorage = () => {
  const data = notificationSettingsStorage.getString(WALLET_GROUPS_STORAGE_KEY);

  if (data) return JSON.parse(data) as GroupSettings;
  return {};
};

/**
 Checks if notification settings exist for a wallet and returns a boolean.
 */
export const walletHasNotificationSettings = (address: string) => {
  const data = getAllNotificationSettingsFromStorage();
  const settings = data.find(
    (wallet: WalletNotificationSettings) => wallet.address === address
  );

  return !!settings;
};

/**
 * Updates settings for all wallets with relationship type
 * @returns updated wallet settings array
 */
export const updateSettingsForWalletsWithRelationshipType = (
  type: NotificationRelationshipType,
  options: object
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
  options: object
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
