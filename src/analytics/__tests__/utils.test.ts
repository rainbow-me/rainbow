import { expect, test, describe, beforeEach } from '@jest/globals';
import * as Sentry from '@sentry/react-native';

import * as ls from '@/storage';
import { getDeviceId } from '@/analytics/utils';
import * as keychain from '@/model/keychain';

jest.mock('@/model/keychain', () => ({
  loadString: jest.fn(),
}));

jest.mock('@sentry/react-native', () => ({
  setUser: jest.fn(),
}));

beforeEach(() => {
  ls.device.remove(['id']);
});

describe(`@/analytics/utils`, () => {
  test(`Returns an ID from storage`, async () => {
    ls.device.set(['id'], 'foo');
    expect(await getDeviceId()).toEqual('foo');
  });

  test(`Returns value from keychain if nothing in storage`, async () => {
    // @ts-ignore it's mocked above
    keychain.loadString.mockImplementation(() => {
      return 'keychain';
    });

    expect(await getDeviceId()).toEqual('keychain');
    expect(Sentry.setUser).toHaveBeenCalledWith({ id: 'keychain' });
  });

  test(`Creates fresh ID if no other exists`, async () => {
    // @ts-ignore it's mocked above
    keychain.loadString.mockImplementation(() => {});
    expect(await getDeviceId()).toBeTruthy();
  });
});
