import { expect, test } from '@jest/globals';

import { Analytics } from '@/analytics';
import Routes from '@/navigation/routesNames';

jest.mock('@/env', () => ({
  IS_DEV: false,
  IS_TEST: false,
  IS_PROD: true,
  IS_ANDROID: false,
}));

jest.mock('@/storage', () => ({
  device: { get: jest.fn(() => undefined) },
}));

jest.mock('@/analytics/appsflyer', () => ({
  initAppsFlyer: jest.fn(),
}));

jest.mock('@rudderstack/rudder-sdk-react-native', () => ({
  setup: jest.fn().mockResolvedValue(undefined),
  track: jest.fn(),
  identify: jest.fn(),
  screen: jest.fn(),
}));

const flushPromises = () => new Promise(resolve => setImmediate(resolve));

describe('@/analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('track', async () => {
    const analytics = new Analytics();
    analytics.init({ deviceId: 'test-device' });
    await flushPromises();

    analytics.setWalletContext({ walletAddressHash: 'hash', walletType: 'owned' });
    analytics.track(analytics.event.pressedButton);

    expect(analytics.client.track).toHaveBeenCalledWith(analytics.event.pressedButton, {
      walletAddressHash: 'hash',
      walletType: 'owned',
    });
  });

  test('identify', async () => {
    const analytics = new Analytics();
    analytics.init({ deviceId: 'id' });
    await flushPromises();

    analytics.setWalletContext({ walletAddressHash: 'hash', walletType: 'owned' });
    analytics.identify({ currency: 'USD' });

    expect(analytics.client.identify).toHaveBeenCalledWith(
      'id',
      {
        currency: 'USD',
        walletAddressHash: 'hash',
        walletType: 'owned',
      },
      {}
    );
  });

  test('screen', async () => {
    const analytics = new Analytics();
    analytics.init({ deviceId: 'test-device' });
    await flushPromises();

    analytics.setWalletContext({ walletAddressHash: 'hash', walletType: 'owned' });
    analytics.screen(Routes.BACKUP_SHEET);

    expect(analytics.client.screen).toHaveBeenCalledWith(Routes.BACKUP_SHEET, {
      walletAddressHash: 'hash',
      walletType: 'owned',
    });
  });

  test('disablement', async () => {
    const analytics = new Analytics();
    analytics.init({ deviceId: 'test-device' });
    await flushPromises();

    analytics.disable();

    analytics.track(analytics.event.pressedButton);
    analytics.identify({ currency: 'USD' });
    analytics.screen(Routes.BACKUP_SHEET);

    expect(analytics.client.track).not.toHaveBeenCalled();
    expect(analytics.client.identify).not.toHaveBeenCalled();
    expect(analytics.client.screen).not.toHaveBeenCalled();
  });
});
