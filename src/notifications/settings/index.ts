export { DEFAULT_ENABLED_TOPIC_SETTINGS, WalletNotificationRelationship, WalletNotificationTopic, WALLET_GROUPS_STORAGE_KEY, WALLET_TOPICS_STORAGE_KEY } from './constants';
export { addDefaultNotificationGroupSettings, initializeNotificationSettingsForAddresses } from './initialization';
export { useAllNotificationSettingsFromStorage, useWalletGroupNotificationSettings } from './hooks';
export { publishAndSaveWalletSettings, removeNotificationSettingsForWallet, toggleGroupNotifications, toggleTopicForWallet } from './settings';
export type {
  AddressWithRelationship,
  GlobalNotificationTopicType,
  GroupSettings,
  WalletNotificationRelationshipType,
  WalletNotificationTopicType,
  WalletNotificationSettings,
} from './types';
export { getAllWalletNotificationSettingsFromStorage, setAllWalletNotificationSettingsToStorage, notificationSettingsStorage, updateGroupSettings, updateSettingsForWalletsWithRelationshipType } from './storage';
