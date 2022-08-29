/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import RemoteMessage = FirebaseMessagingTypes.RemoteMessage;
import { ANDROID_DEFAULT_CHANNEL_ID } from '@/notificaitons/constants';
import notifee, { AndroidStyle, Notification } from '@notifee/react-native';
import { logger } from '@/utils';

// FCM sends a different kind than the typings cover
interface FixedRemoteMessage extends RemoteMessage {
  data: { [key: string]: string } & { fcm_options: { image: string } };
}

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
    android: { channelId: ANDROID_DEFAULT_CHANNEL_ID },
    data,
    ios: {
      foregroundPresentationOptions: {
        badge: true,
        banner: true,
        list: true,
      },
    },
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
