import messaging from '@react-native-firebase/messaging';

import { getLocal, saveLocal } from '@/handlers/localstorage/common';
import { getPermissionStatus } from '@/notifications/permissions';
import { logger, RainbowError } from '@/logger';

export const registerTokenRefreshListener = () =>
  messaging().onTokenRefresh(fcmToken => {
    saveLocal('rainbowFcmToken', { data: fcmToken });
  });

export const saveFCMToken = async () => {
  try {
    const permissionStatus = await getPermissionStatus();
    if (permissionStatus === messaging.AuthorizationStatus.AUTHORIZED || permissionStatus === messaging.AuthorizationStatus.PROVISIONAL) {
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        saveLocal('rainbowFcmToken', { data: fcmToken });
      }
    }
  } catch (error) {
    logger.warn('Error while getting and saving FCM token', {
      error,
    });
  }
};

export async function getFCMToken(): Promise<string | undefined> {
  const fcmTokenLocal = await getLocal('rainbowFcmToken');
  const token = fcmTokenLocal?.data || undefined;

  if (!token) {
    logger.debug('getFCMToken: No FCM token found');
  }

  return token;
}
