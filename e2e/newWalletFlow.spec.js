/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */
import * as Helpers from './helpers';

describe('New Wallet flow', () => {
  beforeAll(async () => {
    await device.reloadReactNative();
  });

  it('should show the welcome screen', async () => {
    await Helpers.checkIfVisible('welcome-screen');
  });

  it('go to the wallet screen after pressing "Get a new wallet" button', async () => {
    await Helpers.tap('new-wallet-button');
    await Helpers.checkIfVisible('wallet-screen');
  });

  it('should show the "Add funds" button', async () => {
    await Helpers.checkIfVisible('add-funds-button');
  });

  it('should show "No transactions yet" in the activity list', async () => {
    await Helpers.swipe('wallet-screen', 'right');
    await Helpers.delay(2000);
    await Helpers.checkIfVisible('no-transactions-yet-label');
  });

  afterAll(async () => {
    // Reset the app state
    await device.clearKeychain();
    // await Helpers.tap('settings-button');
    // await Helpers.waitAndTap('dev-section-button');
    // await Helpers.waitAndTap('reset-keychain-button');
    // await Helpers.delay(2000);
  });
});
