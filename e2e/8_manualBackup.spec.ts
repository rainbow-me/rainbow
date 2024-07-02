/* eslint-disable no-await-in-loop */
import {
  beforeAllcleanApp,
  importWalletFlow,
  afterAllcleanApp,
  tap,
  tapByText,
  delayTime,
  tapAtPoint,
  checkIfExistsByText,
  checkIfExists,
  waitAndTap,
  checkIfDoesntExist,
} from './helpers';

describe('Backups', () => {
  beforeAll(async () => {
    await beforeAllcleanApp({ hardhat: false });
  });
  afterAll(async () => {
    await afterAllcleanApp({ hardhat: false });
  });

  it('Imports wallet', async () => {
    await importWalletFlow();
  });

  it('Should go to settings', async () => {
    await tapAtPoint('wallet-screen', { x: 355, y: 80 });
    await tapByText('Settings');
    await checkIfExists('settings-sheet');
  });

  it('Should go to backups', async () => {
    await tap('backup-section');
    await checkIfExistsByText('Wallets & Backup');
  });

  it('Should alert that iCloud isnt enabled', async () => {
    await waitAndTap('backup-now-button');
    await checkIfExistsByText('iCloud Not Enabled');
    await tapByText('No thanks');
  });

  it('Should go to specific wallets backup sheet and view seed phrase', async () => {
    await delayTime('medium');
    await tapByText('Not backed up');
    await delayTime('medium');
    await tapByText('Back Up Manually');
    await waitAndTap('show-secret-button');
  });

  it('Should check if seed phrase exists word by word and confirm backup', async () => {
    await delayTime('medium');
    const words = process.env.TEST_SEEDS ? process.env.TEST_SEEDS.split(' ') : [];
    for (const word of words) {
      await checkIfExistsByText(word.trim());
    }
    await delayTime('medium');
    await tapByText("􀆅 I've saved these words");
  });

  it('Should go back to the backup sheet and it should be updated', async () => {
    await delayTime('medium');
    await checkIfExistsByText('Wallets & Backup');
    await checkIfDoesntExist('Not backed up', 1_000);
  });

  it('Should go to specific wallets backup sheet and it should be backup up now', async () => {
    await delayTime('medium');
    await tapByText('Imported');
    await delayTime('medium');
    await checkIfExistsByText('Backed up manually');
  });
});
