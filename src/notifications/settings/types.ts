import {
  NotificationRelationship,
  NotificationTopic,
} from '@/notifications/settings/constants';

export type NotificationTopicType = typeof NotificationTopic[keyof typeof NotificationTopic];

export type NotificationRelationshipType = typeof NotificationRelationship[keyof typeof NotificationRelationship];

export type WalletNotificationTopics = {
  [key: NotificationTopicType]: boolean;
};

export type WalletNotificationSettings = {
  address: string;
  topics: WalletNotificationTopics;
  enabled: boolean;
  type: NotificationRelationshipType;
  successfullyFinishedInitialSubscription: boolean;
  // only set in cases when the user imported an already watched wallet
  oldType?: NotificationRelationshipType;
};

export type GroupSettings = {
  [key: NotificationRelationshipType]: boolean;
};

export type AddressWithRelationship = {
  address: string;
  relationship: NotificationRelationshipType;
};
