/* eslint-disable no-await-in-loop */
import {
  beforeAllcleanApp,
  importWalletFlow,
  afterAllcleanApp,
  tap,
  tapByText,
  delayTime,
  checkIfExistsByText,
  checkIfExists,
  waitAndTap,
  checkIfDoesntExist,
} from '../helpers';

describe('Backups', () => {
  beforeAll(async () => {
    await beforeAllcleanApp({ anvil: false });
  });
  afterAll(async () => {
    await afterAllcleanApp({ anvil: false });
  });

  it('Imports wallet', async () => {
    await importWalletFlow();
  });

  it('Should go to settings', async () => {
    await waitAndTap('settings-menu');
    await tapByText('Settings');
    await checkIfExists('settings-sheet');
  });

  it('Should go to backups', async () => {
    await tap('backup-section');
    await checkIfExistsByText('Wallets & Backup');
  });

  it('Should alert that iCloud isnt enabled', async () => {
    await waitAndTap('backup-now-button');

    // Alert
    await checkIfExistsByText('iCloud Not Enabled');
    await tapByText('No thanks');
  });

  it('Should go to specific wallets backup sheet and view seed phrase', async () => {
    await delayTime('medium');
    await waitAndTap('not-backed-up');
    await delayTime('long');
    await waitAndTap('back-up-manually');
    await delayTime('medium');
    await waitAndTap('show-secret-button');
  });

  it('Should check if seed phrase exists word by word and confirm backup', async () => {
    await delayTime('medium');
    const words = process.env.TEST_SEEDS ? process.env.TEST_SEEDS.split(' ') : [];
    for (const word of words) {
      await checkIfExistsByText(word.trim());
    }
    await delayTime('medium');
    await waitAndTap('saved-these-words');
  });

  it('Should go back to the backup sheet and it should be updated', async () => {
    await delayTime('medium');
    await checkIfExistsByText('Wallets & Backup');
    await checkIfDoesntExist('not-backed-up', 1_000);
  });

  it('Should go to specific wallets backup sheet and it should be backup up now', async () => {
    await delayTime('medium');
    await tap('back-ups-imported');
    await delayTime('medium');
    await checkIfExists('backed-up-manually');
  });
});
