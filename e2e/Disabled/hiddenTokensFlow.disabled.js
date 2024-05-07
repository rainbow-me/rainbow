import * as Helpers from '../helpers';
import { device, element, by, waitFor } from 'detox';

const android = device.getPlatform() === 'android';

describe.skip('Hidden tokens flow', () => {
  it('boots and loads wallet screen', async () => {
    await Helpers.waitAndTap('already-have-wallet-button');
    await Helpers.waitAndTap('restore-with-key-button');
    await Helpers.clearField('import-sheet-input');
    await Helpers.typeText('import-sheet-input', process.env.TEST_SEEDS, false);
    await Helpers.waitAndTap('import-sheet-button');
    await Helpers.disableSynchronization();
    await Helpers.waitAndTap('wallet-info-submit-button');
    if (android) {
      await Helpers.checkIfVisible('pin-authentication-screen');
      // Set the pin
      await Helpers.authenticatePin('1234');
      // Confirm it
      await Helpers.authenticatePin('1234');
    }
    await Helpers.checkIfVisible('wallet-screen', 80000);
    await Helpers.enableSynchronization();
  });

  it('NFT is hideable', async () => {
    // open ENS and tap on our ENS NFT
    await Helpers.swipe('wallet-screen', 'up', 'slow');
    await Helpers.tap('token-family-header-ENS');
    await Helpers.swipe('wallet-screen', 'up', 'slow');
    await Helpers.waitAndTap('wrapped-nft-rainbowtestwallet.eth');
    await Helpers.waitAndTap('unique-mainnet-expanded-state-context-menu-button');

    if (android) {
      await waitFor(element(by.text('Hide')))
        .toBeVisible()
        .withTimeout(2000);
      await element(by.text('Hide')).tap();
    } else {
      await waitFor(element(by.label('Hide')).atIndex(1)).toBeVisible();
      await element(by.label('Hide')).atIndex(1).tap();
    }
  });

  it('NFT shows in Hidden collection', async () => {
    // open ENS and tap on our ENS NFT
    await waitFor(element(by.id('token-family-header-Hidden'))).toBeVisible();
  });

  it('NFT is unhideable', async () => {
    // open ENS and tap on our ENS NFT
    await Helpers.swipe('wallet-screen', 'up', 'slow');
    await Helpers.tap('token-family-header-Hidden');
    await Helpers.swipe('wallet-screen', 'up', 'slow');
    await Helpers.waitAndTap('wrapped-nft-rainbowtestwallet.eth');
    await Helpers.waitAndTap('unique-mainnet-expanded-state-context-menu-button');

    await waitFor(element(by.text('Unhide')))
      .toBeVisible()
      .withTimeout(2000);
    await element(by.text('Unhide')).tap();

    await waitFor(element(by.id('token-family-header-Hidden'))).toNotExist();

    await Helpers.checkIfVisible('wrapped-nft-rainbowtestwallet.eth');
  });

  afterAll(async () => {
    await device.clearKeychain();
  });
});
