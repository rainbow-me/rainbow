/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ANDROID_DEFAULT_CHANNEL_ID } from '@/notifications/constants';
import notifee, { AndroidStyle, Notification } from '@notifee/react-native';
import { logger } from '@/utils';
import { FixedRemoteMessage } from '@/notifications/types';

export function handleShowingForegroundNotification(
  remoteMessage: FixedRemoteMessage
) {
  const image = ios
    ? remoteMessage.data?.fcm_options?.image
    : remoteMessage.notification?.android?.imageUrl;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { fcm_options, ...data } = remoteMessage.data;
  const notification: Notification = {
    ...remoteMessage.notification,
    android: {
      smallIcon: 'ic_state_ic_notification',
      channelId: ANDROID_DEFAULT_CHANNEL_ID,
      pressAction: { id: 'default' },
    },
    data,
    ios: {},
  };

  if (image) {
    notification.ios!.attachments = [{ url: image }];
    notification.android!.largeIcon = image;
    notification.android!.style = {
      picture: image,
      type: AndroidStyle.BIGPICTURE,
    };
  }

  notifee.displayNotification(notification).catch(e => {
    logger.sentry(e);
  });
}
