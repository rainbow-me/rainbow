export {
  DEFAULT_ENABLED_TOPIC_SETTINGS,
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
  publishAndSaveWalletSettings,
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
  getAllNotificationSettingsFromStorage,
  notificationSettingsStorage,
  setAllNotificationSettingsToStorage,
  updateGroupSettings,
} from './storage';
