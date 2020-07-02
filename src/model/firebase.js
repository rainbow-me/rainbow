import messaging from '@react-native-firebase/messaging';
import lang from 'i18n-js';
import { get } from 'lodash';
import { Alert } from '../components/alerts';
import { getLocal, saveLocal } from '../handlers/localstorage/common';
import logger from 'logger';

export const getFCMToken = async () => {
  const fcmTokenLocal = await getLocal('rainbowFcmToken');

  const fcmToken = get(fcmTokenLocal, 'data', null);

  if (!fcmToken) {
    throw new Error('Push notification token unavailable.');
  }
  return fcmToken;
};

export const saveFCMToken = async () => {
  try {
    const fcmToken = await messaging().getToken();
    if (fcmToken) {
      saveLocal('rainbowFcmToken', { data: fcmToken });
    }
  } catch (error) {
    logger.log('error getting fcm token - cannot save', error);
  }
};

export const hasPermission = () => messaging().hasPermission();

export const requestPermission = () => messaging().requestPermission();

export const checkPushNotificationPermissions = async () => {
  return new Promise(async resolve => {
    let permissionStatus = null;
    try {
      permissionStatus = await hasPermission();
    } catch (error) {
      logger.log(
        'Error checking if a user has push notifications permission',
        error
      );
    }

    if (permissionStatus !== messaging.AuthorizationStatus.AUTHORIZED) {
      Alert({
        buttons: [
          {
            onPress: async () => {
              try {
                await requestPermission();
                await saveFCMToken();
              } catch (error) {
                logger.log('User rejected push notifications permissions');
              } finally {
                resolve(true);
              }
            },
            text: 'Okay',
          },
          {
            onPress: async () => {
              resolve(true);
            },
            style: 'cancel',
            text: 'Dismiss',
          },
        ],
        message: lang.t('wallet.push_notifications.please_enable_body'),
        title: lang.t('wallet.push_notifications.please_enable_title'),
      });
    } else {
      resolve(true);
    }
  });
};

export const registerTokenRefreshListener = () =>
  messaging().onTokenRefresh(fcmToken => {
    saveLocal('rainbowFcmToken', { data: fcmToken });
  });
