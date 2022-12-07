import {
  NotificationRelationship,
  NotificationTopic,
} from '@/notifications/settings/constants';

export type NotificationTopicType = typeof NotificationTopic[keyof typeof NotificationTopic];

export type NotificationRelationshipType = typeof NotificationRelationship[keyof typeof NotificationRelationship];

export type WalletNotificationSettings = {
  address: string;
  topics: { [key: NotificationTopicType]: boolean };
  enabled: boolean;
  type: NotificationRelationshipType;
};

export type GroupSettings = {
  [key: NotificationRelationshipType]: boolean;
};
