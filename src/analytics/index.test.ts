import { expect, test } from '@jest/globals';
import { PostHog, type PostHogOptions } from 'posthog-react-native';
import * as analyticsConfig from 'react-native-dotenv';

import { Analytics } from '@/analytics';
import { AppsFlyer } from '@/analytics/appsflyer';
import { logger } from '@/logger';
import Routes from '@/navigation/routesNames';
import { device } from '@/storage';
import { type Device } from '@/storage/schema';

jest.mock('@/env', () => ({
  IS_DEV: false,
  IS_TEST: false,
  IS_PROD: true,
  IS_ANDROID: false,
}));

jest.mock('@/storage', () => ({
  device: { get: jest.fn(() => undefined), set: jest.fn() },
}));

jest.mock('react-native-device-info', () => ({
  getVersion: () => '2.0.47',
  getBuildNumber: () => '1',
}));

jest.mock('@/analytics/appsflyer', () => ({
  AppsFlyer: jest.fn().mockImplementation(() => ({
    uid: undefined,
    init: jest.fn(),
    stop: jest.fn(),
  })),
}));

jest.mock('react-native-dotenv', () => ({
  __esModule: true,
  POSTHOG_API_KEY: 'phc_test',
  POSTHOG_HOST: 'https://us.i.posthog.com',
}));

jest.mock('posthog-react-native', () => ({
  PostHog: jest.fn().mockImplementation(() => ({
    ready: jest.fn().mockResolvedValue(undefined),
    capture: jest.fn(),
    identify: jest.fn(),
    screen: jest.fn(),
    optIn: jest.fn().mockResolvedValue(undefined),
    optOut: jest.fn().mockResolvedValue(undefined),
  })),
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
    jest.restoreAllMocks();
    jest.clearAllMocks();
    mockDeviceGet.mockReturnValue(undefined);
    jest.mocked(device.set).mockReset();
  });

  test('track', async () => {
    const analytics = new Analytics();
    analytics.init({ deviceId: 'test-device' });
    await flushPromises();

    analytics.setWalletContext({ walletAddressHash: 'hash', walletType: 'owned' });
    analytics.track(analytics.event.perpsWithdrew, { amount: 12.34 }, { walletAddressHash: 'override', walletType: 'hardware' });

    expect(analytics.client?.capture).toHaveBeenCalledWith('perps.withdrew', {
      amount: 12.34,
      walletAddressHash: 'override',
      walletType: 'hardware',
    });
  });

  test('capture preserves the real AppsFlyer UID as a PostHog event property', async () => {
    const analytics = new Analytics();
    analytics.init({ deviceId: 'test-device' });
    getLatestAppsFlyerInstance().uid = 'appsflyer-id';
    await flushPromises();

    analytics.track(analytics.event.pressedButton);

    expect(analytics.client?.capture).toHaveBeenCalledWith(analytics.event.pressedButton, {
      walletAddressHash: undefined,
      walletType: undefined,
      appsflyer_id: 'appsflyer-id',
    });
  });

  test('identify', async () => {
    const analytics = new Analytics();
    analytics.init({ deviceId: 'id' });
    await flushPromises();

    analytics.setWalletContext({ walletAddressHash: 'hash', walletType: 'owned' });
    analytics.identify({ currency: 'USD' });

    expect(analytics.client?.identify).toHaveBeenCalledWith('id', {
      currency: 'USD',
      walletAddressHash: 'hash',
      walletType: 'owned',
    });
  });

  test('screen', async () => {
    const analytics = new Analytics();
    analytics.init({ deviceId: 'test-device' });
    await flushPromises();

    analytics.setWalletContext({ walletAddressHash: 'hash', walletType: 'owned' });
    analytics.screen(Routes.BACKUP_SHEET);

    expect(analytics.client?.screen).toHaveBeenCalledWith(Routes.BACKUP_SHEET, {
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

    expect(analytics.client?.capture).not.toHaveBeenCalled();
    expect(analytics.client?.identify).not.toHaveBeenCalled();
    expect(analytics.client?.screen).not.toHaveBeenCalled();
    expect(getLatestAppsFlyerInstance().stop).toHaveBeenCalledWith(true);
    expect(analytics.client?.optOut).toHaveBeenCalledTimes(1);
    analytics.enable();
    expect(analytics.client?.optIn).toHaveBeenCalledTimes(2);
  });

  test('initializes both SDKs only after re-enabling analytics', async () => {
    mockDeviceGet.mockReturnValue(true);

    const analytics = new Analytics();
    const appsFlyer = getLatestAppsFlyerInstance();

    analytics.init({ deviceId: 'test-device' });
    await flushPromises();
    expect(PostHog).not.toHaveBeenCalled();
    expect(appsFlyer.init).not.toHaveBeenCalled();
    analytics.enable();
    await flushPromises();
    expect(PostHog).toHaveBeenCalledTimes(1);

    expect(appsFlyer.stop).toHaveBeenCalledWith(false);
    expect(appsFlyer.init).toHaveBeenCalledWith('test-device');
  });

  test('queues startup events until the existing device ID is available', async () => {
    const analytics = new Analytics();
    analytics.track(analytics.event.pressedButton);
    await flushPromises();
    expect(PostHog).not.toHaveBeenCalled();

    analytics.init({ deviceId: 'existing-rainbow-id' });
    await flushPromises();
    expect(PostHog).toHaveBeenCalledWith(
      'phc_test',
      expect.objectContaining({
        host: 'https://us.i.posthog.com',
        bootstrap: { distinctId: 'existing-rainbow-id', isIdentifiedId: true },
        disableRemoteFeatureFlags: true,
      })
    );
    expect(analytics.client?.capture).toHaveBeenCalledTimes(1);
  });

  test('drops queued events and automatic events when disabled during initialization', async () => {
    const analytics = new Analytics();
    analytics.init({ deviceId: 'test-device' });
    analytics.track(analytics.event.pressedButton);
    analytics.disable();
    await flushPromises();

    expect(analytics.client?.capture).not.toHaveBeenCalled();
    expect(analytics.client?.optOut).toHaveBeenCalled();
    const options = jest.mocked(PostHog).mock.calls[0][1] as PostHogOptions;
    if (typeof options.before_send !== 'function') throw new Error('Expected a before_send callback');
    expect(options.before_send?.({ event: 'Application Opened', properties: {} })).toBeNull();
  });

  test('preserves PostHog lifecycle names and properties and avoids counting migrating users as new installs', async () => {
    mockDeviceGet.mockImplementation(([key]) => key === 'isReturningUser');
    const analytics = new Analytics();
    analytics.init({ deviceId: 'test-device' });
    await flushPromises();

    const options = jest.mocked(PostHog).mock.calls[0][1] as PostHogOptions;
    if (typeof options.before_send !== 'function') throw new Error('Expected a before_send callback');
    const event = { event: 'Application Installed', properties: {} };
    expect(options.before_send?.(event)).toBeNull();
    for (const name of ['Application Opened', 'Application Became Active', 'Application Updated']) {
      expect(options.before_send({ event: name, properties: { $app_version: '2.0.47', $app_build: '1' } })).toEqual({
        event: name,
        properties: { $app_version: '2.0.47', $app_build: '1' },
      });
    }
  });

  test('missing PostHog configuration leaves AppsFlyer initialization intact without retrying on every event', async () => {
    const warning = jest.spyOn(logger, 'warn').mockImplementation(() => {});
    jest.replaceProperty(analyticsConfig, 'POSTHOG_API_KEY', '');
    const analytics = new Analytics();
    analytics.init({ deviceId: 'test-device' });
    analytics.track(analytics.event.pressedButton);
    analytics.track(analytics.event.pressedButton);
    await flushPromises();

    expect(PostHog).not.toHaveBeenCalled();
    expect(getLatestAppsFlyerInstance().init).toHaveBeenCalledTimes(1);
    expect(getLatestAppsFlyerInstance().stop).not.toHaveBeenCalled();
    expect(warning).toHaveBeenCalledWith('[Analytics]: POSTHOG_API_KEY and POSTHOG_HOST are required');
  });

  test('tracks a version upgrade with an unchanged build only once across launches', async () => {
    let previous = { version: '2.0.46', build: '1' };
    mockDeviceGet.mockImplementation(([key]) => (key === 'analyticsAppVersion' ? previous : undefined));
    jest.mocked(device.set).mockImplementation((key, value) => {
      if (key[0] === 'analyticsAppVersion') previous = value as Device['analyticsAppVersion'];
    });

    const analytics = new Analytics();
    analytics.init({ deviceId: 'test-device' });
    await flushPromises();

    expect(analytics.client?.capture).toHaveBeenCalledTimes(1);
    expect(analytics.client?.capture).toHaveBeenCalledWith('Application Updated', {
      previous_version: '2.0.46',
      previous_build: '1',
    });
    expect(previous).toEqual({ version: '2.0.47', build: '1' });

    const relaunchedAnalytics = new Analytics();
    relaunchedAnalytics.init({ deviceId: 'test-device' });
    await flushPromises();
    expect(relaunchedAnalytics.client?.capture).not.toHaveBeenCalled();
  });

  test.each([
    ['first PostHog launch', undefined],
    ['version and build change handled by PostHog', { version: '2.0.46', build: '2' }],
    ['build-only change handled by PostHog', { version: '2.0.47', build: '2' }],
  ])('does not add an update event on %s', async (_description, previous) => {
    mockDeviceGet.mockImplementation(([key]) => (key === 'analyticsAppVersion' ? previous : undefined));
    const analytics = new Analytics();
    analytics.init({ deviceId: 'test-device' });
    await flushPromises();

    expect(analytics.client?.capture).not.toHaveBeenCalled();
    expect(device.set).toHaveBeenCalledWith(['analyticsAppVersion'], { version: '2.0.47', build: '1' });
  });
});
