/* eslint-disable no-nested-ternary */
import '../../src/languages';

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
