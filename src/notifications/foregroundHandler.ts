/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ANDROID_DEFAULT_CHANNEL_ID } from '@/notifications/constants';
import notifee, { AndroidStyle, Notification } from '@notifee/react-native';
import { FixedRemoteMessage } from '@/notifications/types';
import { logger, RainbowError } from '@/logger';

export function handleShowingForegroundNotification(remoteMessage: FixedRemoteMessage) {
  const image = ios ? remoteMessage.data?.fcm_options?.image : remoteMessage.notification?.android?.imageUrl;
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

  notifee.displayNotification(notification).catch(error => {
    logger.error(new RainbowError('Error while displaying notification with notifee library'), { error });
  });
}
