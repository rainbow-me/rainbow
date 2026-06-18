import { expect, test } from '@jest/globals';

import { Analytics } from '@/analytics';
import { AppsFlyer } from '@/analytics/appsflyer';
import Routes from '@/navigation/routesNames';
import { device } from '@/storage';

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
  AppsFlyer: jest.fn().mockImplementation(() => ({
    uid: undefined,
    init: jest.fn(),
    stop: jest.fn(),
  })),
}));

jest.mock('@rudderstack/rudder-sdk-react-native', () => ({
  setup: jest.fn().mockResolvedValue(undefined),
  track: jest.fn(),
  identify: jest.fn(),
  screen: jest.fn(),
}));

const flushPromises = () => new Promise(resolve => setImmediate(resolve));
const mockAppsFlyerClass = AppsFlyer as jest.MockedClass<typeof AppsFlyer>;
const mockDeviceGet = device.get as jest.Mock;
type MockAppsFlyer = { init: jest.Mock; stop: jest.Mock; uid?: string };

function getLatestAppsFlyerInstance(): MockAppsFlyer {
  const latestInstance = mockAppsFlyerClass.mock.results.at(-1)?.value;
  return latestInstance as MockAppsFlyer;
}

describe('@/analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDeviceGet.mockReturnValue(undefined);
  });

  test('track', async () => {
    const analytics = new Analytics();
    analytics.init({ deviceId: 'test-device' });
    await flushPromises();

    analytics.setWalletContext({ walletAddressHash: 'hash', walletType: 'owned' });
    analytics.track(analytics.event.pressedButton);

    expect(analytics.client.track).toHaveBeenCalledWith(
      analytics.event.pressedButton,
      {
        walletAddressHash: 'hash',
        walletType: 'owned',
      },
      {}
    );
  });

  test('track attaches AppsFlyer external id when available', async () => {
    const analytics = new Analytics();
    analytics.init({ deviceId: 'test-device' });
    getLatestAppsFlyerInstance().uid = 'appsflyer-id';
    await flushPromises();

    analytics.track(analytics.event.pressedButton);

    expect(analytics.client.track).toHaveBeenCalledWith(
      analytics.event.pressedButton,
      {
        walletAddressHash: undefined,
        walletType: undefined,
      },
      {
        externalId: [{ type: 'appsflyerExternalId', id: 'appsflyer-id' }],
      }
    );
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
    expect(getLatestAppsFlyerInstance().stop).toHaveBeenCalledWith(true);
  });

  test('initializes AppsFlyer after re-enabling analytics', () => {
    mockDeviceGet.mockReturnValue(true);

    const analytics = new Analytics();
    const appsFlyer = getLatestAppsFlyerInstance();

    analytics.init({ deviceId: 'test-device' });
    analytics.enable();

    expect(appsFlyer.stop).toHaveBeenCalledWith(false);
    expect(appsFlyer.init).toHaveBeenCalledWith('test-device');
  });
});
