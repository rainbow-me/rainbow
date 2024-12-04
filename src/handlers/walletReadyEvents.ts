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
import { InteractionManager } from 'react-native';
import { IS_TEST } from '@/env';
import { backupsStore, LoadingStates } from '@/state/backups/backups';

export const runKeychainIntegrityChecks = async () => {
  const keychainIntegrityState = await getKeychainIntegrityState();
  if (!keychainIntegrityState) {
    await store.dispatch(checkKeychainIntegrity());
  }
};

const delay = (ms: number) =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

const promptForBackupOnceReadyOrNotAvailable = async (): Promise<void> => {
  const { status } = backupsStore.getState();
  if (LoadingStates.includes(status)) {
    await delay(1000);
    return promptForBackupOnceReadyOrNotAvailable();
  }

  InteractionManager.runAfterInteractions(() => {
    logger.debug(`[walletReadyEvents]: BackupSheet: showing backup now sheet for selected wallet`);
    triggerOnSwipeLayout(() =>
      Navigation.handleAction(Routes.BACKUP_SHEET, {
        step: WalletBackupStepTypes.backup_prompt,
      })
    );
  });
};

export const runWalletBackupStatusChecks = () => {
  const { selected } = store.getState().wallets;
  if (!selected || IS_TEST) return;

  const selectedWalletNeedsBackedUp = !selected.backedUp && !selected.damaged && selected.type !== WalletTypes.readOnly;
  if (selectedWalletNeedsBackedUp) {
    logger.debug('[walletReadyEvents]: Selected wallet is not backed up, prompting backup sheet');
    promptForBackupOnceReadyOrNotAvailable();
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
