/* eslint-disable no-undef */
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

jest.autoMockOff();
jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: {
    ALWAYS_THIS_DEVICE_ONLY: 'kSecAttrAccessibleAlwaysThisDeviceOnly',
  },
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
  setGenericPassword: jest.fn(),
}));

jest.mock('react-native', () => ({
  Platform: OS => OS,
  select: () => null,
}));

jest.mock('react-native-mmkv');
