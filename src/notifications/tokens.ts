import messaging from '@react-native-firebase/messaging';

import { getLocal, saveLocal } from '@/handlers/localstorage/common';
import { logger } from '@/logger';
import { getPermissionStatus, isNotificationPermissionGranted } from '@/notifications/permissions';

const RAINBOW_FCM_TOKEN_KEY = 'rainbowFcmToken';

export const registerTokenRefreshListener = () =>
  messaging().onTokenRefresh(fcmToken => {
    saveLocal(RAINBOW_FCM_TOKEN_KEY, { data: fcmToken });
  });

export const saveFCMToken = async (): Promise<string | null> => {
  try {
    const permissionStatus = await getPermissionStatus();
    if (!isNotificationPermissionGranted(permissionStatus)) {
      // Expected state for users who declined permission prompt or have not yet been prompted.
      return null;
    }

    const fcmToken = await messaging().getToken();
    if (!fcmToken) {
      logger.warn('[notifications]: messaging().getToken() returned empty despite granted permission', {
        permissionStatus,
      });
      return null;
    }
    saveLocal(RAINBOW_FCM_TOKEN_KEY, { data: fcmToken });
    return fcmToken;
  } catch (error) {
    logger.warn('[notifications]: saveFCMToken failed', { error });
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
