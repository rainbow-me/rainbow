import {
  tap,
  beforeAllcleanApp,
  waitAndTap,
  clearField,
  typeText,
  checkIfVisible,
  swipe,
  checkIfDoesntExist,
  delayTime,
  afterAllcleanApp,
} from './helpers';

describe('Watched showcase and hidden actions flow', () => {
  beforeAll(async () => {
    await beforeAllcleanApp({ hardhat: false });
  });
  afterAll(async () => {
    await afterAllcleanApp({ hardhat: false });
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
    // some delay to wait for collectables to fetch
    await delayTime('very-long');
    await swipe('wallet-screen', 'up', 'slow');
    await tap('token-family-header-ENS');
    await swipe('wallet-screen', 'up', 'slow');
    await waitAndTap('wrapped-nft-rainbowtestwallet.eth');
  });

  it('hides actions for watched wallets', async () => {
    await checkIfDoesntExist('Showcase');
    await waitAndTap('unique-token-expanded-state-context-menu-button');
    await checkIfDoesntExist('Unhide');
  });
});
