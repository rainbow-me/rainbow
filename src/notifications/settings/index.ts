export {
  NotificationRelationship,
  NotificationTopic,
  WALLET_GROUPS_STORAGE_KEY,
  WALLET_TOPICS_STORAGE_KEY,
} from './constants';
export {
  addDefaultNotificationGroupSettings,
  initializeNotificationSettingsForAddresses,
} from './initialization';
export {
  useAllNotificationSettingsFromStorage,
  useWalletGroupNotificationSettings,
} from './hooks';
export {
  removeNotificationSettingsForWallet,
  toggleGroupNotifications,
  toggleTopicForWallet,
} from './settings';
export type {
  AddressWithRelationship,
  GroupSettings,
  NotificationRelationshipType,
  NotificationTopicType,
  WalletNotificationSettings,
} from './types';
export {
  notificationSettingsStorage,
  updateGroupSettings,
  updateSettingsForWalletsWithRelationshipType,
} from './storage';
