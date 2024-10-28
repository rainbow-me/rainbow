import messaging from '@react-native-firebase/messaging';
import { PermissionStatus, requestNotifications, RESULTS } from 'react-native-permissions';
import { subscribeExistingNotificationsSettings } from '@/notifications/settings/initialization';
import { Alert } from '@/components/alerts';
import lang from 'i18n-js';
import { saveFCMToken } from '@/notifications/tokens';
import { trackPushNotificationPermissionStatus } from '@/notifications/analytics';
import { logger, RainbowError } from '@/logger';
import * as i18n from '@/languages';

export const getPermissionStatus = () => messaging().hasPermission();

export const isNotificationPermissionGranted = (status: PermissionStatus): boolean =>
  status === RESULTS.GRANTED || status === RESULTS.LIMITED;

export const requestNotificationPermission = async (): Promise<PermissionStatus> => {
  const notificationSetting = await requestNotifications(['alert', 'sound', 'badge']);
  const { status } = notificationSetting;
  const enabled = isNotificationPermissionGranted(status);
  if (enabled) {
    subscribeExistingNotificationsSettings();
  }
  return status;
};

export const checkPushNotificationPermissions = async () => {
  return new Promise(async resolve => {
    let permissionStatus = null;
    try {
      permissionStatus = await getPermissionStatus();
    } catch (error) {
      logger.error(new RainbowError('[notifications]: Error checking if a user has push notifications permission'), {
        error,
      });
    }

    if (permissionStatus !== messaging.AuthorizationStatus.AUTHORIZED && permissionStatus !== messaging.AuthorizationStatus.PROVISIONAL) {
      Alert({
        buttons: [
          {
            onPress: async () => {
              try {
                const status = await requestNotificationPermission();
                const enabled = isNotificationPermissionGranted(status);
                trackPushNotificationPermissionStatus(enabled ? 'enabled' : 'disabled');
                await saveFCMToken();
              } catch (error) {
                logger.error(new RainbowError('[notifications]: Error while getting permissions'), { error });
              } finally {
                resolve(true);
              }
            },
            // i18n
            text: i18n.t(i18n.l.button.okay),
          },
          {
            onPress: async () => {
              resolve(true);
            },
            style: 'cancel',
            // i18n
            text: i18n.t(i18n.l.button.dismiss),
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
