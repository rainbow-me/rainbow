import React, { useEffect, useRef } from 'react';
import { InteractionManager } from 'react-native';
import { UnlockableAppIconKey, unlockableAppIcons } from '@/features/app-icon/appIcons';
import { unlockableAppIconCheck } from '@/features/app-icon/unlockableAppIconCheck';
import { EthereumAddress } from '@/entities/wallet';
import { IS_TEST } from '@/env';
import WalletBackupStepTypes from '@/helpers/walletBackupStepTypes';
import walletBackupTypes from '@/helpers/walletBackupTypes';
import WalletTypes from '@/helpers/walletTypes';
import { useActiveRoute } from '@/hooks/useActiveRoute';
import { RainbowAccount } from '@/model/wallet';
import { Navigation } from '@/navigation';
import { Route } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { backupsStore, LoadingStates, oneWeekInMs } from '@/state/backups/backups';
import { isSwipeRoute } from '@/state/navigation/navigationStore';
import { getSelectedWallet, getWallets, useWalletsStore } from '@/state/wallets/walletsStore';
import { ReviewPromptAction } from '@/storage/schema';
import { delay } from '@/utils/delay';
import { handleReviewPromptAction } from '@/utils/reviewAlert';
import { time } from '@/utils/time';

let hasRunSessionEntryPrompt = false;
let runningSessionEntryPrompt: Promise<void> | null = null;

const BACKUP_STATUS_POLL_INTERVAL_MS = time.ms(250);
const BACKUP_STATUS_TIMEOUT_MS = time.seconds(15);
const BACKUP_SHEET_ENTRY_TIMEOUT_MS = time.seconds(3);

const runSessionEntryPromptOnce = async (): Promise<void> => {
  if (hasRunSessionEntryPrompt || IS_TEST) return;
  if (runningSessionEntryPrompt) return runningSessionEntryPrompt;

  runningSessionEntryPrompt = (async () => {
    try {
      const didShowBackupPrompt = await maybeShowBackupPrompt();
      if (didShowBackupPrompt) {
        await waitForBackupPromptToOpenAndDismiss();
      }

      await handleReviewPromptAction(ReviewPromptAction.ViewedWalletScreen);

      if (didShowBackupPrompt) {
        return;
      }
      await maybeShowAppIconUnlockPrompt();
    } finally {
      hasRunSessionEntryPrompt = true;
      runningSessionEntryPrompt = null;
    }
  })();

  return runningSessionEntryPrompt;
};

async function maybeShowBackupPrompt(): Promise<boolean> {
  const selected = getSelectedWallet();
  if (!selected) return false;

  if (selected.backedUp || selected.damaged || selected.imported) return false;
  if (selected.type === WalletTypes.readOnly || selected.type === WalletTypes.bluetooth) return false;

  await waitForBackupStatusToSettle();

  const { status, backupProvider, lastBackupPromptAt, timesPromptedForBackup } = backupsStore.getState();

  if (LoadingStates.includes(status)) return false;

  const cooldownMs = oneWeekInMs * (timesPromptedForBackup + 1);
  if (lastBackupPromptAt && Date.now() - lastBackupPromptAt < cooldownMs) {
    return false;
  }

  const step =
    backupProvider === walletBackupTypes.cloud
      ? WalletBackupStepTypes.backup_prompt_cloud
      : backupProvider === walletBackupTypes.manual
        ? WalletBackupStepTypes.backup_prompt_manual
        : WalletBackupStepTypes.backup_prompt;

  Navigation.handleAction(Routes.BACKUP_SHEET, { step });
  return true;
}

async function maybeShowAppIconUnlockPrompt(): Promise<boolean> {
  const wallets = getWallets();
  if (!wallets) return false;
  const walletsToCheck: EthereumAddress[] = [];

  Object.values(wallets).forEach(wallet => {
    if (wallet.type !== WalletTypes.readOnly) {
      (wallet.addresses || []).forEach((account: RainbowAccount) => {
        if (account.visible) walletsToCheck.push(account.address);
      });
    }
  });

  if (!walletsToCheck.length) return false;

  const appIconKeys = Object.keys(unlockableAppIcons) as UnlockableAppIconKey[];

  for (const appIconKey of appIconKeys) {
    const unlockNow = await unlockableAppIconCheck(appIconKey, walletsToCheck);
    if (unlockNow) {
      Navigation.handleAction(Routes.APP_ICON_UNLOCK_SHEET, { appIconKey });
      return true;
    }
  }

  return false;
}

async function waitForBackupStatusToSettle(): Promise<void> {
  const start = Date.now();
  while (LoadingStates.includes(backupsStore.getState().status) && Date.now() - start < BACKUP_STATUS_TIMEOUT_MS) {
    await delay(BACKUP_STATUS_POLL_INTERVAL_MS);
  }
}

async function waitForBackupPromptToOpenAndDismiss(): Promise<void> {
  const start = Date.now();
  while (Navigation.getActiveRouteName() !== Routes.BACKUP_SHEET && Date.now() - start < BACKUP_SHEET_ENTRY_TIMEOUT_MS) {
    await delay(BACKUP_STATUS_POLL_INTERVAL_MS);
  }

  while (Navigation.getActiveRouteName() === Routes.BACKUP_SHEET) {
    await delay(BACKUP_STATUS_POLL_INTERVAL_MS);
  }
}

const SessionEntryPromptSyncComponent = () => {
  const activeRoute = useActiveRoute();
  const walletReady = useWalletsStore(state => state.walletReady);
  const startedRef = useRef(false);

  useEffect(() => {
    const isSwipeExperienceRoute = !!activeRoute && (activeRoute === Routes.SWIPE_LAYOUT || isSwipeRoute(activeRoute as Route));
    if (startedRef.current || !walletReady || !activeRoute || !isSwipeExperienceRoute) {
      return;
    }

    startedRef.current = true;
    InteractionManager.runAfterInteractions(() => {
      void runSessionEntryPromptOnce();
    });
  }, [activeRoute, walletReady]);

  return null;
};

export const SessionEntryPromptSync = React.memo(SessionEntryPromptSyncComponent, () => true);
