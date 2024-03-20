import * as Helpers from './helpers';
import { device, element, by, expect } from 'detox';

describe('Watched showcase and hidden actions flow', () => {
  afterAll(async () => {
    await device.clearKeychain();
    await Helpers.killHardhat();
  });

  it('watches a wallet and loads wallet screen', async () => {
    await Helpers.waitAndTap('already-have-wallet-button');
    await Helpers.waitAndTap('watch-address-button');
    await Helpers.clearField('import-sheet-input');
    await Helpers.typeText('import-sheet-input', 'rainbowtestwallet.eth', false);
    await Helpers.waitAndTap('import-sheet-button');
    await Helpers.waitAndTap('wallet-info-submit-button');
    await Helpers.checkIfVisible('wallet-screen');
  });

  it('opens NFT', async () => {
    await Helpers.swipe('wallet-screen', 'up', 'slow');
    await Helpers.tap('token-family-header-ENS');
    await Helpers.swipe('wallet-screen', 'up', 'slow');
    await Helpers.waitAndTap('wrapped-nft-rainbowtestwallet.eth');
  });

  it('hides actions for watched wallets', async () => {
    await expect(element(by.text('Showcase'))).not.toExist();
    await Helpers.waitAndTap('unique-token-expanded-state-context-menu-button');
    await expect(element(by.text('Unhide'))).not.toExist();
  });
});
