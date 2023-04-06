import { IS_TESTING } from 'react-native-dotenv';
import { triggerOnSwipeLayout } from '../navigation/onNavigationStateChange';
import { getKeychainIntegrityState } from './localstorage/globalSettings';
import { runCampaignChecks } from '@/campaigns/campaignChecks';
import { EthereumAddress } from '@/entities';
import WalletBackupStepTypes from '@/helpers/walletBackupStepTypes';
import WalletTypes from '@/helpers/walletTypes';
import { featureUnlockChecks } from '@/featuresToUnlock';
import {
  AllRainbowWallets,
  RainbowAccount,
  RainbowWallet,
} from '@/model/wallet';
import { Navigation } from '@/navigation';

import store from '@/redux/store';
import { checkKeychainIntegrity } from '@/redux/wallets';
import Routes from '@/navigation/routesNames';
import { logger } from '@/logger';

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
      wallet.type !== WalletTypes.bluetooth &&
      !wallet.backedUp
    );
  });

  if (!rainbowWalletsNotBackedUp.length) return;

  logger.debug('there is a rainbow wallet not backed up');

  const hasSelectedWallet = rainbowWalletsNotBackedUp.find(
    notBackedUpWallet => notBackedUpWallet.id === selected!.id
  );

  logger.debug('rainbow wallet not backed up that is selected?', {
    hasSelectedWallet,
  });

  // if one of them is selected, show the default BackupSheet
  if (selected && hasSelectedWallet && IS_TESTING !== 'true') {
    logger.debug('showing default BackupSheet');
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
      logger.debug('showing BackupSheet with existing_user step');
      triggerOnSwipeLayout(() =>
        Navigation.handleAction(Routes.BACKUP_SHEET, {
          single: true,
          step: WalletBackupStepTypes.existing_user,
        })
      );
    }, BACKUP_SHEET_DELAY_MS);
  return;
};

export const runFeatureUnlockChecks = async (): Promise<boolean> => {
  const {
    wallets,
  }: {
    wallets: AllRainbowWallets | null;
  } = store.getState().wallets;

  // count how many visible, non-imported and non-readonly wallets are not backed up
  if (!wallets) return false;
  const walletsToCheck: EthereumAddress[] = [];

  Object.values(wallets).forEach(wallet => {
    if (wallet.type !== WalletTypes.readOnly) {
      wallet.addresses?.forEach(
        (account: RainbowAccount) =>
          account.visible && walletsToCheck.push(account.address)
      );
    }
  });

  logger.debug('WALLETS TO CHECK', { walletsToCheck });

  if (!walletsToCheck.length) return false;

  logger.debug('Feature Unlocks: Running Checks');

  // short circuits once the first feature is unlocked
  for (const featureUnlockCheck of featureUnlockChecks) {
    const unlockNow = await featureUnlockCheck(walletsToCheck);
    if (unlockNow) {
      return true;
    }
  }
  return false;
};

export const runFeatureAndCampaignChecks = async () => {
  const showingFeatureUnlock: boolean = await runFeatureUnlockChecks();
  if (!showingFeatureUnlock) {
    await runCampaignChecks();
  }
};
