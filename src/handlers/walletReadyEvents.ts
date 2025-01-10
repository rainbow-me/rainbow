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
import { IS_TEST } from '@/env';
import { backupsStore, CloudBackupState, LoadingStates, oneWeekInMs } from '@/state/backups/backups';
import walletBackupTypes from '@/helpers/walletBackupTypes';

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

const promptForBackupOnceReadyOrNotAvailable = async (): Promise<boolean> => {
  let { status } = backupsStore.getState();
  while (LoadingStates.includes(status)) {
    await delay(1000);
    status = backupsStore.getState().status;
  }

  if (status !== CloudBackupState.Ready) {
    return false;
  }

  const { backupProvider, timesPromptedForBackup, lastBackupPromptAt } = backupsStore.getState();

  // prompt for backup every week if first time prompting, otherwise prompt every 2 weeks
  if (lastBackupPromptAt && Date.now() - lastBackupPromptAt < oneWeekInMs * (timesPromptedForBackup + 1)) {
    return false;
  }

  const step =
    backupProvider === walletBackupTypes.cloud
      ? WalletBackupStepTypes.backup_prompt_cloud
      : backupProvider === walletBackupTypes.manual
        ? WalletBackupStepTypes.backup_prompt_manual
        : WalletBackupStepTypes.backup_prompt;

  logger.debug(`[walletReadyEvents]: BackupSheet: showing ${step} backup sheet`);
  triggerOnSwipeLayout(() =>
    Navigation.handleAction(Routes.BACKUP_SHEET, {
      step,
    })
  );
  return true;
};

export const runWalletBackupStatusChecks = async (): Promise<boolean> => {
  const { selected } = store.getState().wallets;
  if (!selected || IS_TEST) return false;

  if (
    !selected.backedUp &&
    !selected.damaged &&
    !selected.imported &&
    selected.type !== WalletTypes.readOnly &&
    selected.type !== WalletTypes.bluetooth
  ) {
    logger.debug('[walletReadyEvents]: Selected wallet is not backed up, prompting backup sheet');
    return promptForBackupOnceReadyOrNotAvailable();
  }
  return false;
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

export const runFeaturesLocalCampaignAndBackupChecks = async () => {
  if (await runFeatureUnlockChecks()) {
    return true;
  }
  if (await runLocalCampaignChecks()) {
    return true;
  }
  if (await runWalletBackupStatusChecks()) {
    return true;
  }

  return false;
};
