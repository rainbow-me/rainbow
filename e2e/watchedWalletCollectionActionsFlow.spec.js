/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */
import { exec } from 'child_process';
import * as Helpers from './helpers';

describe('Watched showcase and hidden actions flow', () => {
  it('boots and loads wallet screen', async () => {
    // Watch a wallet.
    await Helpers.waitAndTap('already-have-wallet-button');
    await Helpers.waitAndTap('watch-address-button');
    await Helpers.clearField('import-sheet-input');
    await Helpers.typeText(
      'import-sheet-input',
      'rainbowtestwallet.eth',
      false
    );
    await Helpers.waitAndTap('import-sheet-button');
    await Helpers.waitAndTap('wallet-info-submit-button');
    await Helpers.checkIfVisible('wallet-screen', 80000);
  });

  it('opens NFT', async () => {
    await Helpers.swipe('wallet-screen', 'up', 'slow');
    await Helpers.tap('token-family-header-ENS');
    await Helpers.swipe('wallet-screen', 'up', 'slow');
    await Helpers.waitAndTap('wrapped-nft-rainbowtestwallet.eth');
  });

  it('hides actions for watched wallets', async () => {
    await expect(element(by.text('Showcase'))).toNotExist();
    await Helpers.waitAndTap('unique-token-expanded-state-context-menu-button');
    await expect(element(by.text('Unhide'))).toNotExist();
  });

  afterAll(async () => {
    await device.clearKeychain();
    await exec('kill $(lsof -t -i:8545)');
  });
});
