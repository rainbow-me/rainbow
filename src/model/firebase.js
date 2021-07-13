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
    logger.log('⚡⚡⚡ NO FCM TOKEN Locally');
    throw new Error('Push notification token unavailable.');
  }
  return fcmToken;
};

export const saveFCMToken = async () => {
  try {
    const permissionStatus = await getPermissionStatus();
    logger.log('⚡⚡⚡ permissionStatus', permissionStatus);
    if (
      permissionStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      permissionStatus === messaging.AuthorizationStatus.PROVISIONAL
    ) {
      logger.log('⚡⚡⚡ BOUTA SAVE');
      const fcmToken = await messaging().getToken();
      logger.log('⚡⚡⚡ GOT TOKEN', fcmToken);
      if (fcmToken) {
        logger.log('⚡⚡⚡ TOKEN SAVED', fcmToken);
        saveLocal('rainbowFcmToken', { data: fcmToken });
      }
    }
  } catch (error) {
    logger.log('⚡⚡⚡ error saving fcm token - cannot save', error);
  }
};

export const getPermissionStatus = () => messaging().hasPermission();

export const requestPermission = () => messaging().requestPermission();

export const checkPushNotificationPermissions = async () => {
  return new Promise(async resolve => {
    let permissionStatus = null;
    try {
      logger.debug('⚡⚡⚡ CHECKING PUSH NOTIFICATION PERMISSIONS');
      permissionStatus = await getPermissionStatus();
    } catch (error) {
      logger.log(
        'Error checking if a user has push notifications permission',
        error
      );
    }

    if (
      permissionStatus !== messaging.AuthorizationStatus.AUTHORIZED &&
      permissionStatus !== messaging.AuthorizationStatus.PROVISIONAL
    ) {
      Alert({
        buttons: [
          {
            onPress: async () => {
              try {
                logger.log('⚡⚡⚡ requestPermission');
                await requestPermission();
                logger.log('⚡⚡⚡ saveFCMToken');
                await saveFCMToken();
                logger.log('⚡⚡⚡ Done');
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
    logger.log('⚡⚡⚡ TOKEN REFRESH', fcmToken);
    saveLocal('rainbowFcmToken', { data: fcmToken });
  });
