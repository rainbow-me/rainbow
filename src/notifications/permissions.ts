import { PermissionStatus, requestNotifications, RESULTS, checkNotifications } from 'react-native-permissions';
import { subscribeExistingNotificationsSettings } from '@/notifications/settings/initialization';
import { Alert } from '@/components/alerts';
import * as i18n from '@/languages';
import { saveFCMToken } from '@/notifications/tokens';
import { trackPushNotificationPermissionStatus } from '@/notifications/analytics';
import { logger, RainbowError } from '@/logger';

export const getPermissionStatus = async (): Promise<PermissionStatus> => {
  const { status } = await checkNotifications();
  return status;
};

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

    const enabled = permissionStatus ? isNotificationPermissionGranted(permissionStatus) : false;
    if (!enabled) {
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
        message: i18n.t(i18n.l.wallet.push_notifications.please_enable_body),
        title: i18n.t(i18n.l.wallet.push_notifications.please_enable_title),
      });
    } else {
      resolve(true);
    }
  });
};

export const shouldShowNotificationPermissionScreen = async (): Promise<boolean> => {
  try {
    const status = await getPermissionStatus();
    return status === RESULTS.DENIED;
  } catch {
    return false;
  }
};
