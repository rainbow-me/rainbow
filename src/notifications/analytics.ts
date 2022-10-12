import { analytics } from '@/analytics';
import { MinimalNotification } from '@/notifications/types';
import {
  NotificationRelationshipType,
  NotificationTopicType,
} from './settings';
import { getPermissionStatus } from '@/notifications/permissions';
import messaging from '@react-native-firebase/messaging';

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

export const trackChangedNotificationSettings = (
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

export const trackPushNotificationPermissionStatus = (
  status: PushNotificationPermissionStatus
) => {
  analytics.identify(undefined, { notificationsPermissionStatus: status });
};

type PushNotificationPermissionStatus = 'enabled' | 'disabled' | 'never asked';

export const resolveAndTrackPushNotificationPermissionStatus = async () => {
  const permissionStatus = await getPermissionStatus();
  let statusToReport: PushNotificationPermissionStatus = 'never asked';

  if (
    permissionStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    permissionStatus === messaging.AuthorizationStatus.PROVISIONAL
  ) {
    statusToReport = 'enabled';
  } else if (permissionStatus === messaging.AuthorizationStatus.DENIED) {
    statusToReport = 'disabled';
  }

  trackPushNotificationPermissionStatus(statusToReport);
};
