import { analytics } from '@/analytics';
import { MinimalNotification } from '@/notifications/types';
import { NotificationRelationship, NotificationTopic } from './settings';

type ValueOf<T> = T[keyof T];

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
  topic: ValueOf<typeof NotificationTopic>,
  type: ValueOf<typeof NotificationRelationship>,
  action: 'subscribe' | 'unsubscribe'
) => {
  analytics.track('Changed Notification Settings', {
    chainId,
    topic,
    type,
    action,
  });
};
