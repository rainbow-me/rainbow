import * as Helpers from './helpers';
import { device } from 'detox';

const android = device.getPlatform() === 'android';

describe('New Wallet flow', () => {
  beforeAll(async () => {
    await device.reloadReactNative();
    await Helpers.cleanApp();
  });
  afterAll(async () => {
    await device.clearKeychain();
  });

  it('should show the welcome screen', async () => {
    await Helpers.checkIfVisible('welcome-screen');
  });

  it('go to the wallet screen after pressing "Get a new wallet" button', async () => {
    await Helpers.waitAndTap('new-wallet-button');
    if (android) {
      await Helpers.checkIfVisible('pin-authentication-screen');
      await Helpers.authenticatePin('1234');
      await Helpers.authenticatePin('1234');
    }
    await Helpers.checkIfVisible('wallet-screen');
    await Helpers.delayTime('long');
  });

  it('should show the receive card and its contents', async () => {
    await Helpers.checkIfVisible('receive-card');
    await Helpers.checkIfVisible('copy-address-button');
  });

  it('should show eth asset card with a buy button', async () => {
    await Helpers.checkIfVisible('eth-card');
  });
});
