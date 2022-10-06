import { analytics } from '@/analytics';
import { MinimalNotification } from '@/notifications/types';
import {
  NotificationRelationshipType,
  NotificationTopicType,
} from './settings';

export const trackTappedPushNotification = (
  notification: MinimalNotification | undefined
) => {
  analytics.track('Tapped Push Notification', {
    campaign: {
      name: notification?.data?.type ?? 'default',
      medium: 'Push',
    },
  });
};

export const trackChangedNotificationsSetting = (
  chainId: number,
  topic: NotificationTopicType,
  type: NotificationRelationshipType,
  action: 'subscribe' | 'unsubscribe'
) => {
  analytics.track('Changed Notification Settings', {
    chainId,
    topic,
    type,
    action,
  });
};
