import { device } from 'detox';
import { beforeAllcleanApp, checkIfVisible, waitAndTap, authenticatePin, delayTime, afterAllcleanApp } from './helpers';

const android = device.getPlatform() === 'android';

describe('New Wallet flow', () => {
  beforeAll(async () => {
    await beforeAllcleanApp({ hardhat: false });
  });
  afterAll(async () => {
    await afterAllcleanApp({ hardhat: false });
  });

  it('should show the welcome screen', async () => {
    await checkIfVisible('welcome-screen');
  });

  it('go to the wallet screen after pressing "Get a new wallet" button', async () => {
    await waitAndTap('new-wallet-button');
    if (android) {
      await checkIfVisible('pin-authentication-screen');
      await authenticatePin('1234');
      await authenticatePin('1234');
    }
    await checkIfVisible('wallet-screen');
    await delayTime('long');
  });

  it('should show the receive card and its contents', async () => {
    await checkIfVisible('receive-card');
    await checkIfVisible('copy-address-button');
  });

  it('should show eth asset card with a buy button', async () => {
    await checkIfVisible('eth-card');
  });
});
