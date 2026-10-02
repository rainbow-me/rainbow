import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getOrCreateDeviceId } from '@/analytics/utils';
import * as keychain from '@/features/local-auth/legacyKeychain';
import * as ls from '@/storage';

vi.mock('@/features/local-auth/legacyKeychain', () => ({
  loadString: vi.fn(),
}));

vi.mock('@/redux/store');

vi.mock('@sentry/react-native', () => ({
  setUser: vi.fn(),
}));

beforeEach(() => {
  ls.device.remove(['id']);
});

describe(`@/analytics/utils`, () => {
  test(`Returns an ID from storage`, async () => {
    ls.device.set(['id'], 'foo');
    expect(await getOrCreateDeviceId()).toEqual(['foo', false]);
  });

  test(`Returns value from keychain if nothing in storage`, async () => {
    // @ts-ignore it's mocked above
    keychain.loadString.mockImplementation(() => {
      return 'keychain';
    });

    expect(await getOrCreateDeviceId()).toEqual(['keychain', false]);
  });

  test(`Creates fresh ID if no other exists`, async () => {
    // @ts-ignore it's mocked above
    keychain.loadString.mockImplementation(() => {});
    const [id, created] = await getOrCreateDeviceId();
    expect(id).toBeTruthy();
    expect(created).toEqual(true);
  });
});
