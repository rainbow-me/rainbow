/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */
import * as Helpers from './helpers';

const android = device.getPlatform() === 'android';

describe('New Wallet flow', () => {
  it('should show the welcome screen', async () => {
    await Helpers.checkIfVisible('welcome-screen');
  });

  it('go to the wallet screen after pressing "Get a new wallet" button', async () => {
    await Helpers.disableSynchronization();
    await Helpers.waitAndTap('new-wallet-button');
    if (android) {
      await Helpers.checkIfVisible('pin-authentication-screen');
      // Set the pin
      await Helpers.authenticatePin('1234');
      // Confirm it
      await Helpers.authenticatePin('1234');
    }
    await Helpers.checkIfVisible('wallet-screen', 40000);
    await Helpers.enableSynchronization();
  });

  // Saving for now in case we want to test iCloud back up sheet
  // it('Should show the backup sheet', async () => {
  //   await Helpers.delay(5000);
  //   await Helpers.checkIfVisible('backup-sheet');
  //   await Helpers.swipe('backup-sheet', 'down');
  // });

  it('should show the receive card and its contents', async () => {
    await Helpers.checkIfVisible('receive-card');
    await Helpers.checkIfVisible('copy-address-button');
  });

  it('should show eth asset card with a buy button', async () => {
    await Helpers.checkIfVisible('buy-asset-card-ETH');
    await Helpers.checkIfVisible('buy-button-ETH');
  });

  it('should show "No transactions yet" in the activity list', async () => {
    if (android) {
      await Helpers.waitAndTap('activity-button');
      await Helpers.checkIfElementByTextIsVisible('No transactions yet');
    } else {
      await Helpers.waitAndTap('activity-button');
      await Helpers.checkForElementByLabel('no-transactions-yet-label');
    }
  });

  afterAll(async () => {
    // Reset the app state
    await device.clearKeychain();
  });
});
