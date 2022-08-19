// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
import { IS_TESTING } from 'react-native-dotenv';
import { MMKV } from 'react-native-mmkv';
import { triggerOnSwipeLayout } from '../navigation/onNavigationStateChange';
import { getKeychainIntegrityState } from './localstorage/globalSettings';
import { EthereumAddress } from '@/entities';
import {
  optimismNftAppIconCheck,
  UNLOCK_KEY_OPTIMISM_NFT_APP_ICON,
} from '@/featuresToUnlock';
import WalletBackupStepTypes from '@/helpers/walletBackupStepTypes';
import WalletTypes from '@/helpers/walletTypes';
import {
  AllRainbowWallets,
  RainbowAccount,
  RainbowWallet,
} from '@/model/wallet';
import { Navigation } from '@/navigation';

import store from '@rainbow-me/redux/store';
import { checkKeychainIntegrity } from '@rainbow-me/redux/wallets';
import Routes from '@rainbow-me/routes';
import logger from 'logger';

const BACKUP_SHEET_DELAY_MS = 3000;

export const runKeychainIntegrityChecks = async () => {
  const keychainIntegrityState = await getKeychainIntegrityState();
  if (!keychainIntegrityState) {
    await store.dispatch(checkKeychainIntegrity());
  }
};

export const runWalletBackupStatusChecks = () => {
  const {
    selected,
    wallets,
  }: {
    wallets: AllRainbowWallets | null;
    selected: RainbowWallet | undefined;
  } = store.getState().wallets;

  // count how many visible, non-imported and non-readonly wallets are not backed up
  if (!wallets) return;
  const rainbowWalletsNotBackedUp = Object.values(wallets).filter(wallet => {
    const hasVisibleAccount = wallet.addresses?.find(
      (account: RainbowAccount) => account.visible
    );
    return (
      !wallet.imported &&
      !!hasVisibleAccount &&
      wallet.type !== WalletTypes.readOnly &&
      !wallet.backedUp
    );
  });

  if (!rainbowWalletsNotBackedUp.length) return;

  logger.log('there is a rainbow wallet not backed up');
  const hasSelectedWallet = rainbowWalletsNotBackedUp.find(
    notBackedUpWallet => notBackedUpWallet.id === selected!.id
  );

  logger.log(
    'rainbow wallet not backed up that is selected?',
    hasSelectedWallet
  );

  // if one of them is selected, show the default BackupSheet
  if (selected && hasSelectedWallet && IS_TESTING !== 'true') {
    logger.log('showing default BackupSheet');
    setTimeout(() => {
      triggerOnSwipeLayout(() =>
        Navigation.handleAction(Routes.BACKUP_SHEET, { single: true })
      );
    }, BACKUP_SHEET_DELAY_MS);
    return;
  }

  // otherwise, show the BackupSheet redirecting to the WalletSelectionList
  IS_TESTING !== 'true' &&
    setTimeout(() => {
      logger.log('showing BackupSheet with existing_user step');
      triggerOnSwipeLayout(() =>
        Navigation.handleAction(Routes.BACKUP_SHEET, {
          single: true,
          step: WalletBackupStepTypes.existing_user,
        })
      );
    }, BACKUP_SHEET_DELAY_MS);
  return;
};

export const runFeatureUnlockChecks = () => {
  const {
    wallets,
  }: {
    wallets: AllRainbowWallets | null;
  } = store.getState().wallets;

  // count how many visible, non-imported and non-readonly wallets are not backed up
  if (!wallets) return;
  const walletsToCheck: EthereumAddress[] = [];

  Object.values(wallets).forEach(wallet => {
    if (wallet.type !== WalletTypes.readOnly) {
      wallet.addresses?.forEach(
        (account: RainbowAccount) =>
          account.visible && walletsToCheck.push(account.address)
      );
    }
  });

  logger.log('WALLETS TO CHECK', walletsToCheck);

  if (!walletsToCheck.length) return;

  const featuresToUnlock = [
    {
      check: optimismNftAppIconCheck,
      name: UNLOCK_KEY_OPTIMISM_NFT_APP_ICON,
    },
  ];

  const mmkv = new MMKV();

  featuresToUnlock.forEach(async feature => {
    // Check if it was handled already
    const handled = mmkv.getBoolean(feature.name);
    logger.log(`${feature.name} was handled?`, handled);
    if (!handled) {
      // if not handled yet, check again
      logger.log(`${feature.name} being checked`);
      const result = await feature.check(feature.name, walletsToCheck);
      logger.log(`${feature.name} check result:`, result);
    }
  });
};
