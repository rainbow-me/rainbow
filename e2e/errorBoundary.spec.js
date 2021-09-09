/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */
import * as Helpers from './helpers';

describe('Error boundary flow', () => {
  it('should show the welcome screen', async () => {
    await Helpers.checkIfVisible('welcome-screen');
  });

  it('go to the wallet screen after pressing "Get a new wallet" button', async () => {
    await Helpers.disableSynchronization();
    await Helpers.waitAndTap('new-wallet-button');
    if (device.getPlatform() === 'android') {
      await Helpers.checkIfVisible('pin-authentication-screen');
      // Set the pin
      await Helpers.authenticatePin('1234');
      // Confirm it
      await Helpers.authenticatePin('1234');
    }
    await Helpers.checkIfVisible('wallet-screen', 40000);
    await Helpers.enableSynchronization();
  });

  it('Should navigate to Settings Modal after tapping Settings Button', async () => {
    await Helpers.swipe('wallet-screen', 'right');
    await Helpers.waitAndTap('settings-button');
    await Helpers.checkIfVisible('settings-modal');
  });

  it('Should navigate to Developer Settings after tapping Developer Section', async () => {
    await Helpers.waitAndTap('developer-section');
    await Helpers.checkIfVisible('developer-settings-modal');
  });

  it('Should crash the app and show the error boundary section', async () => {
    await Helpers.waitAndTap('crash-app-section');
    await Helpers.checkIfVisible('error-boundary-container');
    await Helpers.waitAndTap('restart-rainbow-button');
    await Helpers.checkIfVisible('wallet-screen', 40000);

    // reset app
    await device.launchApp({ newInstance: true });
    await Helpers.checkIfVisible('welcome-screen');
  });

  it('Should restart app in Wallet Screen after tapping Restart Rainbow', async () => {
    await Helpers.waitAndTap('restart-rainbow-button');
    await Helpers.checkIfVisible('wallet-screen', 10000);
  });

  afterAll(async () => {
    // Reset the app state
    await device.clearKeychain();
    await Helpers.delay(2000);
  });
});
