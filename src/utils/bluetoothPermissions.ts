import { IS_IOS } from '@/env';
import { logger } from '@/logger';
import { Alert, Linking } from 'react-native';
import * as i18n from '@/languages';
import {
  checkMultiple as checkForMultiplePermissions,
  PERMISSIONS,
  RESULTS,
  request as requestPermission,
  AndroidPermission,
  requestMultiple as requestMultiplePermissions,
} from 'react-native-permissions';

/**
 * Shows an alert if device's bluetooth is powered off
 */
export const showBluetoothPoweredOffAlert = async () => {
  await Alert.alert(i18n.t(i18n.l.bluetooth.powered_off_alert.title), i18n.t(i18n.l.bluetooth.powered_off_alert.message), [
    {
      onPress: () => {
        IS_IOS ? Linking.openURL('App-Prefs:Bluetooth') : Linking.sendIntent('android.settings.BLUETOOTH_SETTINGS');
      },
      text: i18n.t(i18n.l.bluetooth.powered_off_alert.open_settings),
    },
    {
      onPress: () => null,
      style: 'cancel',
      text: i18n.t(i18n.l.bluetooth.powered_off_alert.cancel),
    },
  ]);
};

/**
 * Shows an alert w/ deeplink to settings to enable bluetooth permissions for iOS
 */
export const showBluetoothPermissionsAlert = async () => {
  await Alert.alert(i18n.t(i18n.l.bluetooth.permissions_alert.title), i18n.t(i18n.l.bluetooth.permissions_alert.message), [
    {
      onPress: () => {
        Linking.openSettings();
      },
      text: i18n.t(i18n.l.bluetooth.permissions_alert.open_settings),
    },
    {
      onPress: () => null,
      style: 'cancel',
      text: i18n.t(i18n.l.bluetooth.permissions_alert.cancel),
    },
  ]);
};

/**
 * Checks and requests bluetooth permissions for Android
 */
export const checkAndRequestAndroidBluetooth = async (): Promise<boolean> => {
  const ANDROID_BT_PERMISSION = [
    PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
    PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
    PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
  ];

  const res = await checkForMultiplePermissions(ANDROID_BT_PERMISSION);
  logger.debug('[Bluetooth] Android Permission status: ', { res });

  const deniedPermissions: AndroidPermission[] = [];

  // check if we are missing any permissions
  for (const [key, value] of Object.entries(res)) {
    if (value === RESULTS.DENIED || value === RESULTS.BLOCKED) {
      deniedPermissions.push(key as AndroidPermission);
    }
  }

  if (deniedPermissions.length === 0) {
    logger.debug('[Bluetooth] Android Permissions all granted');
    return true;
  }
  // if we're only missing one, only request one
  else if (deniedPermissions.length === 1) {
    const askResult = await requestPermission(deniedPermissions[0]);
    logger.debug('[Bluetooth] Android Permission single askResult: ', {
      askResult,
    });
    if (askResult === RESULTS.GRANTED) {
      return true;
      // user denied request
    } else if (askResult === RESULTS.DENIED) {
      await showBluetoothPermissionsAlert();

      // should try to deeplink the user at this point or show a fun error :)
      return false;
      // devices without bluetooth & simulators
    } else if (askResult === RESULTS.UNAVAILABLE) {
      return false;
    }

    // else request in a group
  } else if (deniedPermissions.length > 1) {
    const askResults = await requestMultiplePermissions(deniedPermissions);
    logger.debug('[Bluetooth] Android Bluetooth Permission multiple askResult: ', { askResults });

    const deniedOrBlockedPermissions: AndroidPermission[] = [];
    // check if we are missing any permissions
    for (const [key, value] of Object.entries(askResults)) {
      if (value === RESULTS.DENIED || value === RESULTS.BLOCKED) {
        deniedOrBlockedPermissions.push(key as AndroidPermission);
      }
    }
    // all permissions granted
    if (deniedOrBlockedPermissions.length === 0) {
      return true;
    } else {
      // user denied request
      // could recurse here but I think it's better to show the user an alert
      await showBluetoothPermissionsAlert();
    }
  }
  return false;
};
