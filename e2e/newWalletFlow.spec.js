/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */
import * as Helpers from './helpers';

describe('New Wallet flow', () => {
  it('should show the welcome screen', async () => {
    await Helpers.checkIfVisible('welcome-screen');
  });

  it('go to the wallet screen after pressing "Get a new wallet" button', async () => {
    await Helpers.tap('new-wallet-button');
    await Helpers.checkIfVisible('wallet-screen');
  });

  // it('Should show the backup sheet', async () => {
  //   await Helpers.delay(5000);
  //   await Helpers.checkIfVisible('backup-sheet');
  //   await Helpers.swipe('backup-sheet', 'down');
  // });

  it('should show the "Add funds" button', async () => {
    await Helpers.checkIfVisible('copy-address-button');
  });

  it('should show "No transactions yet" in the activity list', async () => {
    await Helpers.swipe('wallet-screen', 'right');
    await Helpers.delay(2000);
    await Helpers.checkIfVisible('no-transactions-yet-label');
  });

  afterAll(async () => {
    // Reset the app state
    await device.clearKeychain();
  });
});
