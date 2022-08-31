/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ANDROID_DEFAULT_CHANNEL_ID } from '@/notifications/constants';
import notifee, { AndroidStyle, Notification } from '@notifee/react-native';
import { logger } from '@/utils';
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

// FCM sends a different kind than the typings cover
interface FixedRemoteMessage extends FirebaseMessagingTypes.RemoteMessage {
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
  console.log(JSON.stringify(remoteMessage, null, 2));
  const notification: Notification = {
    ...remoteMessage.notification,
    android: { channelId: ANDROID_DEFAULT_CHANNEL_ID },
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
