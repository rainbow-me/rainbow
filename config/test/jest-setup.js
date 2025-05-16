/* eslint-disable no-nested-ternary */
import { TurboModuleRegistry } from 'react-native';
import '../../src/languages';
import { getPreference } from '@/model/preferences';

global.ios = false;
global.android = false;

jest.mock('@/env', () => ({
  IS_DEV: false,
  IS_TEST: true,
  IS_PROD: false,
}));

jest.mock('react-native-device-info', () => ({
  identify: () => null,
  reset: () => null,
  setup: () => null,
}));

jest.mock('@rudderstack/rudder-sdk-react-native', () => ({
  createClient: jest.fn(),
  identify: jest.fn(),
  reset: jest.fn(),
  setup: jest.fn(),
}));

jest.mock('@sentry/react-native', () => ({
  captureException: () => null,
}));

jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: {
    ALWAYS_THIS_DEVICE_ONLY: 'kSecAttrAccessibleAlwaysThisDeviceOnly',
  },
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
  setGenericPassword: jest.fn(),
}));

jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

jest.mock('react-native-permissions', () => ({
  requestNotifications: jest.fn(),
}));

const deviceHeight = 874

jest.mock('@/utils', () => {
  const time = {
    seconds: seconds => seconds * 1000,
    minutes: minutes => minutes * 60 * 1000,
    hours: hours => hours * 60 * 60 * 1000,
    days: days => days * 24 * 60 * 60 * 1000,
    weeks: weeks => weeks * 7 * 24 * 60 * 60 * 1000,
    infinity: Infinity,
    zero: 0,
  };

  return {
    deviceUtils: {
      dimensions: {
        height: deviceHeight,
        width: 402,
      },
    },
    time,
    safeAreaInsetValues: {
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    }
  };
});

jest.mock('react-native-extra-dimensions-android', () => {
  return {
    getRealWindowHeight() {
      return deviceHeight
    }
  }
})

jest.mock('@/handlers/ens', () => {
  return {
    async fetchReverseRecord() {
      return ''
    }
  }
})

jest.mock('@/model/backup', () => {
  return {
    parseTimestampFromBackupFile: () => Date.now()
  }
})

jest.mock('@/model/preferences', () => {
  return {
    setPreference: () => {
      return true
    },
    getPreference: () => '',
  }
})
