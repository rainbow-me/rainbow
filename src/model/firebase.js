import lang from 'i18n-js';
import { get } from 'lodash';
import firebase from 'react-native-firebase';
import { Alert } from '../components/alerts';
import { getLocal, saveLocal } from '../handlers/commonStorage';

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
    const fcmToken = await firebase.messaging().getToken();
    if (fcmToken) {
      saveLocal('rainbowFcmToken', { data: fcmToken });
    }
  } catch (error) {
    console.log('error getting fcm token');
  }
};

export const hasPermission = async () => firebase.messaging().hasPermission();

export const requestPermission = async () => firebase.messaging().requestPermission();

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

export const registerTokenRefreshListener = () => firebase.messaging().onTokenRefresh(fcmToken => {
  saveLocal('rainbowFcmToken', { data: fcmToken });
});

export const registerNotificationListener = () => firebase.notifications().onNotification(notification => {
  console.log('onNotification');
});

// TODO this.onPushNotificationOpened
export const registerNotificationOpenedListener = () => firebase.notifications().onNotificationOpened(notificationOpen => {
  const { callId, sessionId } = notificationOpen.notification.data;
  this.onPushNotificationOpened(callId, sessionId, false);
});

export const getInitialNotification = () => firebase.notifications().getInitialNotification();
