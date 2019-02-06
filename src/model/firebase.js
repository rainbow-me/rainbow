import firebase from 'react-native-firebase';
import lang from 'i18n-js';
import { get } from 'lodash';
import { commonStorage } from 'balance-common';
import { Alert } from '../components/alerts';
import Navigation from '../navigation';

export const getFCMToken = async () => {
  const fcmTokenLocal = await commonStorage.getLocal('balanceWalletFcmToken');
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
      commonStorage.saveLocal('balanceWalletFcmToken', { data: fcmToken });
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
    // TODO: try catch around Alert?
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
  commonStorage.saveLocal('balanceWalletFcmToken', { data: fcmToken });
});

export const registerNotificationListener = () => firebase.notifications().onNotification(notification => {
  const navState = get(this.navigatorRef, 'state.nav');
  const route = Navigation.getActiveRouteName(navState);
  const { callId, sessionId } = notification.data;
  if (route === 'ConfirmRequest') {
    this.fetchAndAddWalletConnectRequest(callId, sessionId).then(transaction => {
      const localNotification = new firebase.notifications.Notification()
        .setTitle(notification.title)
        .setBody(notification.body)
        .setData(notification.data);

      firebase.notifications().displayNotification(localNotification);
    });
  } else {
    this.onPushNotificationOpened(callId, sessionId, true);
  }
});

export const registerNotificationOpenedListener = () => firebase.notifications().onNotificationOpened(notificationOpen => {
  const { callId, sessionId } = notificationOpen.notification.data;
  this.onPushNotificationOpened(callId, sessionId, false);
});

export const removeAllDeliveredNotifications = () => firebase.notifications().removeAllDeliveredNotifications();

export const getInitialNotification = () => firebase.notifications().getInitialNotification();
