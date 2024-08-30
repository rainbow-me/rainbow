import { IS_TESTING } from 'react-native-dotenv';
import { triggerOnSwipeLayout } from '../navigation/onNavigationStateChange';
import { getKeychainIntegrityState } from './localstorage/globalSettings';
import { runLocalCampaignChecks } from '@/components/remote-promo-sheet/localCampaignChecks';
import { EthereumAddress } from '@/entities';
import WalletBackupStepTypes from '@/helpers/walletBackupStepTypes';
import WalletTypes from '@/helpers/walletTypes';
import { featureUnlockChecks } from '@/featuresToUnlock';
import { AllRainbowWallets, RainbowAccount, RainbowWallet } from '@/model/wallet';
import { Navigation } from '@/navigation';

import store from '@/redux/store';
import { checkKeychainIntegrity } from '@/redux/wallets';
import Routes from '@/navigation/routesNames';
import { logger } from '@/logger';
import { checkWalletsForBackupStatus } from '@/screens/SettingsSheet/utils';
import walletBackupTypes from '@/helpers/walletBackupTypes';
import { InteractionManager } from 'react-native';

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

  const { backupProvider } = checkWalletsForBackupStatus(wallets);

  const rainbowWalletsNotBackedUp = Object.values(wallets).filter(wallet => {
    const hasVisibleAccount = wallet.addresses?.find((account: RainbowAccount) => account.visible);
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

  const hasSelectedWallet = rainbowWalletsNotBackedUp.find(notBackedUpWallet => notBackedUpWallet.id === selected!.id);
  logger.debug('rainbow wallet not backed up that is selected?', {
    hasSelectedWallet,
  });

  // if one of them is selected, show the default BackupSheet
  if (selected && hasSelectedWallet && IS_TESTING !== 'true') {
    let stepType: string = WalletBackupStepTypes.no_provider;
    if (backupProvider === walletBackupTypes.cloud) {
      stepType = WalletBackupStepTypes.backup_now_to_cloud;
    } else if (backupProvider === walletBackupTypes.manual) {
      stepType = WalletBackupStepTypes.backup_now_manually;
    }

    setTimeout(() => {
      logger.debug(`showing ${stepType} backup sheet for selected wallet`);
      triggerOnSwipeLayout(() =>
        Navigation.handleAction(Routes.BACKUP_SHEET, {
          step: stepType,
        })
      );
    }, BACKUP_SHEET_DELAY_MS);
    return;
  }
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
      wallet.addresses?.forEach((account: RainbowAccount) => account.visible && walletsToCheck.push(account.address));
    }
  });

  logger.debug('WALLETS TO CHECK', { walletsToCheck });

  if (!walletsToCheck.length) return false;

  logger.debug('Feature Unlocks: Running Checks');

  // short circuits once the first feature is unlocked
  for (const featureUnlockCheck of featureUnlockChecks) {
    InteractionManager.runAfterInteractions(async () => {
      const unlockNow = await featureUnlockCheck(walletsToCheck);
      if (unlockNow) {
        return true;
      }
    });
  }
  return false;
};

export const runFeatureAndLocalCampaignChecks = async () => {
  const showingFeatureUnlock: boolean = await runFeatureUnlockChecks();
  if (!showingFeatureUnlock) {
    await runLocalCampaignChecks();
  }
};
