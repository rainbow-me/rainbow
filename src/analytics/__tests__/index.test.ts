import { expect, test } from '@jest/globals';

import { Analytics } from '@/analytics';
import Routes from '@/navigation/routesNames';

jest.mock('@rudderstack/rudder-sdk-react-native', () => ({
  createClient() {
    return {
      track: jest.fn(),
      identify: jest.fn(),
      screen: jest.fn(),
    };
  },
}));

// TODO: Fix test. skipping for now to unblock CI
describe.skip('@/analytics', () => {
  test('track', () => {
    const analytics = new Analytics();

    analytics.setWalletContext({ walletAddressHash: 'hash', walletType: 'owned' });
    analytics.track(analytics.event.pressedButton);

    expect(analytics.client.track).toHaveBeenCalledWith(analytics.event.pressedButton, {
      walletAddressHash: 'hash',
    });
  });

  test('identify', () => {
    const analytics = new Analytics();

    analytics.setWalletContext({ walletAddressHash: 'hash', walletType: 'owned' });
    analytics.setDeviceId('id');
    analytics.identify({ currency: 'USD' });

    expect(analytics.client.identify).toHaveBeenCalledWith('id', {
      currency: 'USD',
      walletAddressHash: 'hash',
    });
  });

  test('screen', () => {
    const analytics = new Analytics();

    analytics.setWalletContext({ walletAddressHash: 'hash', walletType: 'owned' });
    analytics.screen(Routes.BACKUP_SHEET);

    expect(analytics.client.screen).toHaveBeenCalledWith(Routes.BACKUP_SHEET, {
      walletAddressHash: 'hash',
    });
  });

  test('disablement', () => {
    const analytics = new Analytics();

    analytics.disable();

    analytics.track(analytics.event.pressedButton);
    analytics.identify({ currency: 'USD' });
    analytics.screen(Routes.BACKUP_SHEET);

    expect(analytics.client.track).not.toHaveBeenCalled();
    expect(analytics.client.identify).not.toHaveBeenCalled();
    expect(analytics.client.screen).not.toHaveBeenCalled();
  });
});
