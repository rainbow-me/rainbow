import { expect, test } from '@jest/globals';

import { Analytics } from '@/analytics';
import Routes from '@/navigation/routesNames';

jest.mock('@segment/analytics-react-native', () => ({
  createClient() {
    return {
      track: jest.fn(),
      identify: jest.fn(),
      screen: jest.fn(),
    };
  },
}));

describe('@/analytics', () => {
  test('track', () => {
    const analytics = new Analytics();

    analytics.setCurrentWalletAddressHash('hash');
    analytics.track(analytics.event.generic.pressedButton);

    expect(analytics.client.track).toHaveBeenCalledWith(
      analytics.event.generic.pressedButton,
      {
        category: 'generic',
        walletAddressHash: 'hash',
      }
    );
  });

  test('identify', () => {
    const analytics = new Analytics();

    analytics.setCurrentWalletAddressHash('hash');
    analytics.setDeviceId('id');
    analytics.identify({ currency: 'USD' });

    expect(analytics.client.identify).toHaveBeenCalledWith('id', {
      currency: 'USD',
      walletAddressHash: 'hash',
    });
  });

  test('screen', () => {
    const analytics = new Analytics();

    analytics.setCurrentWalletAddressHash('hash');
    analytics.screen(Routes.BACKUP_SHEET);

    expect(analytics.client.screen).toHaveBeenCalledWith(Routes.BACKUP_SHEET, {
      walletAddressHash: 'hash',
    });
  });

  test('Analytics.getTrackingEventCategory', () => {
    const analytics = new Analytics();

    expect(
      analytics.getTrackingEventCategory(analytics.event.swap.submittedSwap)
    ).toEqual('swap');
    expect(
      analytics.getTrackingEventCategory(analytics.event.generic.pressedButton)
    ).toEqual('generic');
    expect(
      // @ts-expect-error Just testing JS case
      analytics.getTrackingEventCategory(analytics.event.foo?.pressedButton)
    ).toEqual(undefined);
  });

  test('disablement', () => {
    const analytics = new Analytics();

    analytics.disable();

    analytics.track(analytics.event.generic.pressedButton);
    analytics.identify({ currency: 'USD' });
    analytics.screen(Routes.BACKUP_SHEET);

    // called once to let us know it was disabled
    expect(analytics.client.track).toHaveBeenCalledTimes(1);
    expect(analytics.client.identify).not.toHaveBeenCalled();
    expect(analytics.client.screen).not.toHaveBeenCalled();
  });
});
