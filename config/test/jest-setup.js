/* eslint-disable no-undef */
jest.autoMockOff();
jest.mock('react-native-keychain', () => ({
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
  setGenericPassword: jest.fn(),
}));
