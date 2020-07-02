import { findKey } from 'lodash';
import {
  getMigrationVersion,
  setMigrationVersion,
} from '../handlers/localstorage/migrations';
import WalletTypes from '../helpers/walletTypes';
import { DEFAULT_WALLET_NAME, loadAddress, saveAddress } from '../model/wallet';
import store from '../redux/store';

import { walletsSetSelected, walletsUpdate } from '../redux/wallets';
import { colors } from '@rainbow-me/styles';
import logger from 'logger';

export default async function runMigrations() {
  // get current version
  const currentVersion = Number(await getMigrationVersion());
  const migrations = [];

  /*
   *************** Migration v0 ******************
   * This step rewrites public keys to the keychain
   * using the updated Keychain settings (THIS_DEVICE_ONLY)
   */
  const v0 = async () => {
    logger.sentry('Start migration v0');
    const walletAddress = await loadAddress();
    if (walletAddress) {
      logger.sentry('v0 migration - Save loaded address');
      await saveAddress(walletAddress);
    }
    logger.sentry('Complete migration v0');
  };

  migrations.push(v0);

  /*
   *************** Migration v1 ******************
   * This step handles the migration to multiwallet
   * adding backwards compatibility for single wallets
   * that were created / imported before we launched this feature
   */
  const v1 = async () => {
    logger.sentry('Start migration v1');
    const { selected } = store.getState().wallets;

    if (!selected) {
      // Read from the old wallet data
      const address = await loadAddress();
      if (address) {
        logger.sentry('v1 migration - address found');
        const id = `wallet_${Date.now()}`;
        const currentWallet = {
          addresses: [
            {
              address,
              avatar: null,
              color: colors.getRandomColor(),
              index: 0,
              label: '',
              visible: true,
            },
          ],
          color: 0,
          id,
          imported: false,
          name: DEFAULT_WALLET_NAME,
          primary: true,
          type: WalletTypes.mnemonic,
        };

        const wallets = { [id]: currentWallet };

        logger.sentry('v1 migration - update wallets and selected wallet');
        await store.dispatch(walletsUpdate(wallets));
        await store.dispatch(walletsSetSelected(currentWallet));
      }
    }
    logger.sentry('Complete migration v1');
  };

  migrations.push(v1);

  /*
   *************** Migration v2 ******************
   * This step handles the addition of "primary wallets"
   * which are the only wallets allowed to create new accounts under it
   */
  const v2 = async () => {
    logger.sentry('Start migration v2');
    const { wallets, selected } = store.getState().wallets;

    if (!wallets) {
      logger.sentry('Complete migration v2 early');
      return;
    }

    // Check if we have a primary wallet
    const primaryWallet = findKey(wallets, ['primary', true]);

    // If there's no primary wallet, we need to find
    // if there's a wallet with seed phrase that wasn't imported
    // and set it as primary
    if (!primaryWallet) {
      logger.sentry('v2 migration - primary wallet not found');
      let primaryWalletKey = null;
      Object.keys(wallets).some(key => {
        const wallet = wallets[key];
        if (wallet.type === WalletTypes.mnemonic && !wallet.imported) {
          primaryWalletKey = key;
          return true;
        }
        return false;
      });

      // If there's no wallet with seed phrase that wasn't imported
      // let's find a wallet with seed phrase that was imported
      if (!primaryWalletKey) {
        Object.keys(wallets).some(key => {
          const wallet = wallets[key];
          if (wallet.type === WalletTypes.mnemonic) {
            primaryWalletKey = key;
            return true;
          }
          return false;
        });
      }

      if (primaryWalletKey) {
        const updatedWallets = { ...wallets };
        updatedWallets[primaryWalletKey] = {
          ...updatedWallets[primaryWalletKey],
          primary: true,
        };
        logger.sentry('v2 migration - update wallets');
        await store.dispatch(walletsUpdate(updatedWallets));
        // Additionally, we need to check if it's the selected wallet
        // and if that's the case, update it too
        if (selected.id === primaryWalletKey) {
          const updatedSelectedWallet = updatedWallets[primaryWalletKey];
          await store.dispatch(walletsSetSelected(updatedSelectedWallet));
        }
      }
    }
    logger.sentry('Complete migration v2');
  };

  migrations.push(v2);

  logger.sentry(
    `Migrations: ready to run migrations starting on number ${currentVersion}`
  );

  if (migrations.length === currentVersion) {
    logger.sentry(`Migrations: Nothing to run`);
    return;
  }

  for (let i = currentVersion; i < migrations.length; i++) {
    logger.sentry(`Migrations: Running migration v${i}`);
    await migrations[i].apply(null);
    logger.sentry(`Migrations: Migration ${i} completed succesfully`);
    await setMigrationVersion(i + 1);
  }
}
