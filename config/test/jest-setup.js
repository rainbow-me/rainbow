/* eslint-disable no-undef */
import { NativeModules } from 'react-native';

jest.autoMockOff();
jest.mock('react-native-keychain', () => ({
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
  setGenericPassword: jest.fn(),
}));

NativeModules.RNAnalytics = {};

const mockAnalytics = jest.genMockFromModule('@segment/analytics-react-native');

jest.mock('@segment/analytics-react-native', () => mockAnalytics);
