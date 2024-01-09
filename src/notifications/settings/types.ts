import {
  NotificationRelationship,
  NotificationTopic,
} from '@/notifications/settings/constants';

export type NotificationTopicType = typeof NotificationTopic[keyof typeof NotificationTopic];

export type NotificationRelationshipType = typeof NotificationRelationship[keyof typeof NotificationRelationship];

export type WalletNotificationTopics = {
  [key: NotificationTopicType]: boolean;
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
  type: NotificationRelationshipType;
  successfullyFinishedInitialSubscription: boolean;
};

export type GroupSettings = {
  [key: NotificationRelationshipType]: boolean;
};

export type AddressWithRelationship = {
  address: string;
  relationship: NotificationRelationshipType;
};
