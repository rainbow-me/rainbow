/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */
import * as Helpers from './helpers';

describe('Hidden tokens flow', () => {
  it('boots and load wallet screen', async () => {
    await Helpers.waitAndTap('already-have-wallet-button');
    await Helpers.waitAndTap('restore-with-key-button');
    await Helpers.clearField('import-sheet-input');
    await Helpers.typeText('import-sheet-input', process.env.TEST_SEEDS, false);
    await Helpers.waitAndTap('import-sheet-button');

    await Helpers.waitAndTap('wallet-info-submit-button');
    await Helpers.checkIfVisible('wallet-screen', 40000);
  });

  it('NFT is hideable', async () => {
    // open ENS and tap on our ENS NFT
    await Helpers.swipe('wallet-screen', 'up', 'slow');
    await Helpers.tapByText('ENS');
    await Helpers.swipe('wallet-screen', 'up', 'slow');
    await Helpers.waitAndTap('wrapped-nft-rainbowtestwallet.eth');
    await Helpers.waitAndTap('unique_token_expanded_state_context_menu_button');

    await waitFor(element(by.label('Hide')).atIndex(1)).toBeVisible();
    await element(by.label('Hide')).atIndex(1).tap();

    await Helpers.waitAndTap('unique_token_expanded_state_context_menu_button');
    await waitFor(element(by.label('Unhide'))).toBeVisible();
  });

  it('NFT shows in Hidden collection', async () => {
    // open ENS and tap on our ENS NFT
    await Helpers.swipe('unique-token-expanded-state', 'down', 'slow');
    await waitFor(element(by.id('token_family_header.Hidden'))).toBeVisible();
  });

  it('NFT is unhideable', async () => {
    // open ENS and tap on our ENS NFT
    await Helpers.swipe('wallet-screen', 'up', 'slow');
    await Helpers.tap('token_family_header.Hidden');
    await Helpers.swipe('wallet-screen', 'up', 'slow');
    await Helpers.waitAndTap('wrapped-nft-rainbowtestwallet.eth');
    await Helpers.waitAndTap('unique_token_expanded_state_context_menu_button');

    await waitFor(element(by.label('Unhide')).atIndex(0)).toBeVisible();
    await element(by.label('Unhide')).atIndex(0).tap();

    await Helpers.swipe('unique-token-expanded-state', 'down', 'slow');
    await waitFor(element(by.id('token_family_header.Hidden'))).toNotExist();

    await Helpers.checkIfVisible('wrapped-nft-rainbowtestwallet.eth');
  });
});
