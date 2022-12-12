export const NotificationTopic = {
  SENT: 'sent',
  RECEIVED: 'received',
  PURCHASED: 'purchased',
  SOLD: 'sold',
  MINTED: 'minted',
  SWAPPED: 'swapped',
  APPROVALS: 'approvals',
  OTHER: 'other',
};
export const NotificationRelationship = {
  OWNER: 'owner',
  WATCHER: 'watcher',
};
export const WALLET_TOPICS_STORAGE_KEY = 'notificationSettings';
export const WALLET_GROUPS_STORAGE_KEY = 'notificationGroupToggle';
export const NOTIFICATIONS_DEFAULT_CHAIN_ID = 1; // hardcoded mainnet until we get multi-chain support
export const DEFAULT_ENABLED_TOPIC_SETTINGS = {};
Object.values(NotificationTopic).forEach(
  // looping through topics and setting them all as true by default
  // @ts-expect-error: Object.values() returns a string[]
  topic => (DEFAULT_ENABLED_TOPIC_SETTINGS[topic] = true)
);
