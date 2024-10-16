import messaging from '@react-native-firebase/messaging';

import { getLocal, saveLocal } from '@/handlers/localstorage/common';
import { getPermissionStatus } from '@/notifications/permissions';
import { logger } from '@/logger';

const RAINBOW_FCM_TOKEN_KEY = 'rainbowFcmToken';

export const registerTokenRefreshListener = () =>
  messaging().onTokenRefresh(fcmToken => {
    saveLocal(RAINBOW_FCM_TOKEN_KEY, { data: fcmToken });
  });

export const saveFCMToken = async (): Promise<string | null> => {
  try {
    const permissionStatus = await getPermissionStatus();
    if (permissionStatus === messaging.AuthorizationStatus.AUTHORIZED || permissionStatus === messaging.AuthorizationStatus.PROVISIONAL) {
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        saveLocal(RAINBOW_FCM_TOKEN_KEY, { data: fcmToken });
        return fcmToken;
      }
    }
    return null;
  } catch (error) {
    logger.warn('[notifications]: Error while getting and saving FCM token', {
      error,
    });
    return null;
  }
};

export async function getFCMToken(): Promise<string | null> {
  const fcmTokenLocal = await getLocal(RAINBOW_FCM_TOKEN_KEY);
  const token = fcmTokenLocal?.data || null;

  if (!token) {
    logger.debug('[notifications]: getFCMToken No FCM token found');
  }

  return token;
}
