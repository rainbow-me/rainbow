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
    const analytics = new Analytics({});

    analytics.setCurrentWalletAddressHash('hash');
    analytics.track(analytics.events.generics.pressedButton);

    expect(analytics.client.track).toHaveBeenCalledWith(
      analytics.events.generics.pressedButton,
      {
        category: 'generics',
        walletAddressHash: 'hash',
      }
    );
  });

  test('identify', () => {
    const analytics = new Analytics({});

    analytics.setCurrentWalletAddressHash('hash');
    analytics.setDeviceId('id');
    analytics.identify({ currency: 'USD' });

    expect(analytics.client.identify).toHaveBeenCalledWith('id', {
      currency: 'USD',
      walletAddressHash: 'hash',
    });
  });

  test('screen', () => {
    const analytics = new Analytics({});

    analytics.setCurrentWalletAddressHash('hash');
    analytics.screen(Routes.BACKUP_SHEET);

    expect(analytics.client.screen).toHaveBeenCalledWith(Routes.BACKUP_SHEET, {
      walletAddressHash: 'hash',
    });
  });

  test('Analytics.getTrackingEventCategory', () => {
    const analytics = new Analytics({});

    expect(
      analytics.getTrackingEventCategory(analytics.events.swaps.submittedSwap)
    ).toEqual('swaps');
    expect(
      analytics.getTrackingEventCategory(
        analytics.events.generics.pressedButton
      )
    ).toEqual('generics');
    // @ts-expect-error Just testing JS case
    expect(
      analytics.getTrackingEventCategory(analytics.events.foo?.pressedButton)
    ).toEqual(undefined);
  });
});
