import messaging from '@react-native-firebase/messaging';
import lang from 'i18n-js';
import { get } from 'lodash';
import { Alert } from '../components/alerts';
import { getLocal, saveLocal } from '../handlers/localstorage/common';

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
    console.log('error getting fcm token');
  }
};

export const hasPermission = () => messaging().hasPermission();

export const requestPermission = () => messaging().requestPermission();

export const checkPushNotificationPermissions = async () => {
  const arePushNotificationsAuthorized = await hasPermission();

  if (!arePushNotificationsAuthorized) {
    Alert({
      buttons: [
        {
          onPress: requestPermission,
          text: 'Okay',
        },
        {
          style: 'cancel',
          text: 'Dismiss',
        },
      ],
      message: lang.t('wallet.push_notifications.please_enable_body'),
      title: lang.t('wallet.push_notifications.please_enable_title'),
    });
  }
};

export const registerTokenRefreshListener = () =>
  messaging().onTokenRefresh(fcmToken => {
    saveLocal('rainbowFcmToken', { data: fcmToken });
  });
