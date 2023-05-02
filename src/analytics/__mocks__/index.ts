/*
 * This _could_ cause issues one day if something gets imported here that
 * breaks test mocks
 */
import { event } from '../event';

export const analyticsV2 = {
  identify: jest.fn(),
  screen: jest.fn(),
  track: jest.fn(),
  setDeviceId: jest.fn(),
  setCurrentWalletAddressHash: jest.fn(),
  enable: jest.fn(),
  disable: jest.fn(),
  event,
};
