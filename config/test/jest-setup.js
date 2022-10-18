/* eslint-disable no-undef */
// needed to set up global translations
import '../../src/languages';

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

jest.mock('@segment/analytics-react-native', () => ({
  identify: () => null,
  reset: () => null,
  setup: () => null,
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
jest.mock('react-native-keychain-android-new', () => ({
  ACCESSIBLE: {
    ALWAYS_THIS_DEVICE_ONLY: 'kSecAttrAccessibleAlwaysThisDeviceOnly',
  },
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
  setGenericPassword: jest.fn(),
}));

jest.mock('react-native-mmkv', () => ({
  MMKV: class MMKVMock {
    _store = new Map();

    set(key, value) {
      this._store.set(key, value);
    }

    getString(key) {
      return this._store.get(key);
    }

    delete(key) {
      return this._store.delete(key);
    }
  },
}));
