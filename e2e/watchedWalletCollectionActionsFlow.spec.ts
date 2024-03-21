import { device, element, by } from 'detox';
import { tap, cleanApp, killHardhat, waitAndTap, clearField, typeText, checkIfVisible, swipe } from './helpers';

describe('Watched showcase and hidden actions flow', () => {
  beforeAll(async () => {
    await device.reloadReactNative();
    await cleanApp();
  });
  afterAll(async () => {
    await device.clearKeychain();
    await killHardhat();
  });

  it('watches a wallet and loads wallet screen', async () => {
    await waitAndTap('already-have-wallet-button');
    await waitAndTap('watch-address-button');
    await clearField('import-sheet-input');
    await typeText('import-sheet-input', 'rainbowtestwallet.eth', false);
    await waitAndTap('import-sheet-button');
    await waitAndTap('wallet-info-submit-button');
    await checkIfVisible('wallet-screen');
  });

  it('opens NFT', async () => {
    await swipe('wallet-screen', 'up', 'slow');
    await tap('token-family-header-ENS');
    await swipe('wallet-screen', 'up', 'slow');
    await waitAndTap('wrapped-nft-rainbowtestwallet.eth');
  });

  it('hides actions for watched wallets', async () => {
    await waitFor(element(by.text('Showcase')))
      .not.toExist()
      .withTimeout(5000);
    await waitAndTap('unique-token-expanded-state-context-menu-button');
    await waitFor(element(by.text('Unhide')))
      .not.toExist()
      .withTimeout(5000);
  });
});
