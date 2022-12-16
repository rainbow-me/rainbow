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
    if (
      permissionStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      permissionStatus === messaging.AuthorizationStatus.PROVISIONAL
    ) {
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        saveLocal('rainbowFcmToken', { data: fcmToken });
      }
    }
  } catch (error) {
    logger.error(new RainbowError('Error while getting and saving FCM token'), {
      error,
    });
  }
};

export const getFCMToken = async () => {
  const fcmTokenLocal = await getLocal('rainbowFcmToken');

  const fcmToken = fcmTokenLocal?.data ?? null;

  if (!fcmToken) {
    throw new Error('Push notification token unavailable.');
  }
  return fcmToken;
};
