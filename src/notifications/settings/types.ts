import { GlobalNotificationTopic, WalletNotificationRelationship, WalletNotificationTopic } from '@/notifications/settings/constants';

export type WalletNotificationTopicType = (typeof WalletNotificationTopic)[keyof typeof WalletNotificationTopic];

export type GlobalNotificationTopicType = (typeof GlobalNotificationTopic)[keyof typeof GlobalNotificationTopic];

export type WalletNotificationRelationshipType = (typeof WalletNotificationRelationship)[keyof typeof WalletNotificationRelationship];

export type WalletNotificationTopics = {
  [key: WalletNotificationTopicType]: boolean;
};

export type GlobalNotificationTopics = {
  [key: GlobalNotificationTopicType]: boolean;
};

export type NotificationSubscriptionWalletsType = {
  type: NotificationRelationshipType;
  chain_id: number;
  address: string;
  transaction_action_types: NotificationTopicType[];
};

export type NotificationSubscriptionType = {
  firebase_token: string;
  wallets: NotificationSubscriptionWalletsType[];
};

export type WalletNotificationSettings = {
  address: string;
  topics: WalletNotificationTopics;
  enabled: boolean;
  type: WalletNotificationRelationshipType;
  successfullyFinishedInitialSubscription: boolean;
  // only set in cases when the user imported an already watched wallet
  oldType?: WalletNotificationRelationshipType;
};

export type GroupSettings = {
  [key: WalletNotificationRelationshipType]: boolean;
};

export type AddressWithRelationship = {
  address: string;
  relationship: WalletNotificationRelationshipType;
};
