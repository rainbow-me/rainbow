import messaging from '@react-native-firebase/messaging';
import { requestNotifications } from 'react-native-permissions';
import logger from 'logger';
import { Alert } from '@/components/alerts';
import lang from 'i18n-js';
import { saveFCMToken } from '@/notifications/tokens';

export const getPermissionStatus = () => messaging().hasPermission();

export const requestPermission = () => {
  return new Promise((resolve, reject) => {
    requestNotifications(['alert', 'sound', 'badge'])
      .then(({ status }) => {
        resolve(status === 'granted');
      })
      .catch(e => reject(e));
  });
};

export const checkPushNotificationPermissions = async () => {
  return new Promise(async resolve => {
    let permissionStatus = null;
    try {
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
                await requestPermission();
                await saveFCMToken();
              } catch (error) {
                logger.log('ERROR while getting permissions', error);
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
