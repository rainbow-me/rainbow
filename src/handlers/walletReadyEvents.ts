import { triggerOnSwipeLayout } from '../navigation/onNavigationStateChange';
import { getKeychainIntegrityState } from './localstorage/globalSettings';
import { runLocalCampaignChecks } from '@/components/remote-promo-sheet/localCampaignChecks';
import { EthereumAddress } from '@/entities';
import WalletBackupStepTypes from '@/helpers/walletBackupStepTypes';
import WalletTypes from '@/helpers/walletTypes';
import { featureUnlockChecks } from '@/featuresToUnlock';
import { AllRainbowWallets, RainbowAccount } from '@/model/wallet';
import { Navigation } from '@/navigation';

import store from '@/redux/store';
import { checkKeychainIntegrity } from '@/redux/wallets';
import Routes from '@/navigation/routesNames';
import { logger } from '@/logger';
import walletBackupTypes from '@/helpers/walletBackupTypes';
import { InteractionManager } from 'react-native';
import { backupsStore } from '@/state/backups/backups';
import { IS_TEST } from '@/env';

export const runKeychainIntegrityChecks = async () => {
  const keychainIntegrityState = await getKeychainIntegrityState();
  if (!keychainIntegrityState) {
    await store.dispatch(checkKeychainIntegrity());
  }
};

export const runWalletBackupStatusChecks = () => {
  const { selected } = store.getState().wallets;
  if (!selected || IS_TEST) return;

  const isSelectedWalletBackedUp = selected.backedUp && !selected.damaged && selected.type !== WalletTypes.readOnly;
  if (!isSelectedWalletBackedUp) {
    logger.debug('[walletReadyEvents]: Selected wallet is not backed up, prompting backup sheet');
    const provider = backupsStore.getState().backupProvider;
    let stepType: string = WalletBackupStepTypes.no_provider;
    if (provider === walletBackupTypes.cloud) {
      stepType = WalletBackupStepTypes.backup_now_to_cloud;
    } else if (provider === walletBackupTypes.manual) {
      stepType = WalletBackupStepTypes.backup_now_manually;
    }

    InteractionManager.runAfterInteractions(() => {
      logger.debug(`[walletReadyEvents]: BackupSheet: showing ${stepType} for selected wallet`);
      triggerOnSwipeLayout(() =>
        Navigation.handleAction(Routes.BACKUP_SHEET, {
          step: stepType,
        })
      );
    });
  }
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

  logger.debug('[walletReadyEvents]: WALLETS TO CHECK', { walletsToCheck });

  if (!walletsToCheck.length) return false;

  logger.debug('[walletReadyEvents]: Feature Unlocks: Running Checks');

  // short circuits once the first feature is unlocked
  for (const featureUnlockCheck of featureUnlockChecks) {
    const unlockNow = await featureUnlockCheck(walletsToCheck);
    if (unlockNow) {
      return true;
    }
  }
  return false;
};

export const runFeatureAndLocalCampaignChecks = async () => {
  const showingFeatureUnlock = await runFeatureUnlockChecks();
  if (!showingFeatureUnlock) {
    return await runLocalCampaignChecks();
  }
  return false;
};
