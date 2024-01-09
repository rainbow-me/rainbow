import messaging from '@react-native-firebase/messaging';

import { getLocal, saveLocal } from '@/handlers/localstorage/common';
import { getPermissionStatus } from '@/notifications/permissions';
import { logger } from '@/logger';

const RAINBOW_FCM_TOKEN_KEY = 'rainbowFcmToken';

export const registerTokenRefreshListener = () =>
  messaging().onTokenRefresh(fcmToken => {
    saveLocal(RAINBOW_FCM_TOKEN_KEY, { data: fcmToken });
  });

export const saveFCMToken = async () => {
  try {
    const permissionStatus = await getPermissionStatus();
    if (
      permissionStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      permissionStatus === messaging.AuthorizationStatus.PROVISIONAL
    ) {
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        saveLocal(RAINBOW_FCM_TOKEN_KEY, { data: fcmToken });
      }
    }
  } catch (error) {
    logger.warn('Error while getting and saving FCM token', {
      error,
    });
  }
};

export async function getFCMToken(): Promise<string | undefined> {
  const fcmTokenLocal = await getLocal(RAINBOW_FCM_TOKEN_KEY);
  const token = fcmTokenLocal?.data || undefined;

  if (!token) {
    logger.debug('getFCMToken: No FCM token found');
  }

  return token;
}
