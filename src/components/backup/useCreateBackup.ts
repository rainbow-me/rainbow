/* eslint-disable no-promise-executor-return */
import { analytics } from '@/analytics';
import { DelayedAlert } from '@/components/alerts';
import { maybeAuthenticateWithPIN } from '@/handlers/authentication';
import showWalletErrorAlert from '@/helpers/support';
import walletBackupStepTypes from '@/helpers/walletBackupStepTypes';
import { useWalletCloudBackup } from '@/hooks';
import i18n from '@/languages';
import { backupAllWalletsToCloud, getLocalBackupPassword, saveLocalBackupPassword } from '@/model/backup';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { backupsStore, CloudBackupState } from '@/state/backups/backups';
import { useWallets } from '@/state/wallets/walletsStore';
import { cloudPlatform } from '@/utils/platform';
import { useCallback } from 'react';
import { InteractionManager } from 'react-native';

type UseCreateBackupProps = {
  walletId?: string;
  addToCurrentBackup?: boolean;
};

type ConfirmBackupProps = {
  password: string;
  userPIN: string | undefined;
} & UseCreateBackupProps;

export const useCreateBackup = () => {
  const walletCloudBackup = useWalletCloudBackup();
  const wallets = useWallets();

  const setLoadingStateWithTimeout = useCallback(
    ({ state, outOfSync = false, failInMs = 10_000 }: { state: CloudBackupState; outOfSync?: boolean; failInMs?: number }) => {
      backupsStore.getState().setStatus(state);
      let outOfSyncTimeout: NodeJS.Timeout | null = null;
      if (outOfSync) {
        outOfSyncTimeout = setTimeout(() => {
          backupsStore.getState().setStatus(CloudBackupState.Syncing);
        }, 1_000);
      }
      const endTimeout = setTimeout(() => {
        const currentState = backupsStore.getState().status;
        if (currentState === state) {
          backupsStore.getState().setStatus(CloudBackupState.Ready);
        }
      }, failInMs);
      return () => {
        clearTimeout(endTimeout);
        if (outOfSyncTimeout != null) {
          clearTimeout(outOfSyncTimeout);
        }
      };
    },
    []
  );

  const onSuccess = useCallback(
    async (password: string) => {
      if (backupsStore.getState().storedPassword !== password) {
        await saveLocalBackupPassword(password);
      }
      // Reset the storedPassword state for next backup
      backupsStore.getState().setStoredPassword('');
      analytics.track(analytics.event.backupComplete, { category: 'backup', label: cloudPlatform });
      const cancelTimeout = setLoadingStateWithTimeout({
        state: CloudBackupState.Success,
        outOfSync: true,
      });
      await backupsStore.getState().syncAndFetchBackups();
      cancelTimeout();
    },
    [setLoadingStateWithTimeout]
  );

  const onError = useCallback(
    (msg: string, isDamaged?: boolean) => {
      InteractionManager.runAfterInteractions(async () => {
        if (isDamaged) {
          showWalletErrorAlert();
        } else {
          DelayedAlert({ title: msg }, 500);
        }
        setLoadingStateWithTimeout({ state: CloudBackupState.Error });
      });
    },
    [setLoadingStateWithTimeout]
  );

  const onConfirmBackup = useCallback(
    async ({ password, walletId, userPIN, addToCurrentBackup = false }: ConfirmBackupProps) => {
      analytics.track(analytics.event.backupConfirmed);
      backupsStore.getState().setStatus(CloudBackupState.InProgress);

      if (typeof walletId === 'undefined') {
        if (!wallets) {
          onError(i18n.back_up.errors.no_keys_found());
          backupsStore.getState().setStatus(CloudBackupState.Error);
          return;
        }

        const validWallets = Object.fromEntries(Object.entries(wallets).filter(([_, wallet]) => !wallet.damaged));
        if (Object.keys(validWallets).length === 0) {
          onError(i18n.back_up.errors.no_keys_found(), true);
          backupsStore.getState().setStatus(CloudBackupState.Error);
          return;
        }

        backupAllWalletsToCloud({
          wallets: validWallets,
          password,
          onError,
          onSuccess,
          userPIN,
        });
        return;
      }

      await walletCloudBackup({
        onError,
        onSuccess,
        password,
        walletId,
        addToCurrentBackup,
      });
    },
    [walletCloudBackup, onError, wallets, onSuccess]
  );

  const getPassword = useCallback(async (props: UseCreateBackupProps, userPIN: string | undefined): Promise<string | null> => {
    const password = await getLocalBackupPassword(userPIN);
    if (password) {
      backupsStore.getState().setStoredPassword(password);
      return password;
    }

    return new Promise(resolve => {
      Navigation.handleAction(Routes.BACKUP_SHEET, {
        nativeScreen: true,
        step: walletBackupStepTypes.create_cloud_backup,
        onSuccess: async (password: string) => {
          return resolve(password);
        },
        onCancel: async () => {
          return resolve(null);
        },
        ...props,
      });
    });
  }, []);

  const createBackup = useCallback(
    async (props: UseCreateBackupProps) => {
      if (backupsStore.getState().status !== CloudBackupState.Ready) {
        return false;
      }

      let userPIN: string | undefined;
      try {
        userPIN = await maybeAuthenticateWithPIN();
      } catch (e) {
        onError?.(i18n.back_up.wrong_pin());
        return;
      }

      const password = await getPassword(props, userPIN);
      if (!password) {
        setLoadingStateWithTimeout({
          state: CloudBackupState.Ready,
        });
        return false;
      }
      onConfirmBackup({
        password,
        userPIN,
        ...props,
      });
      return true;
    },
    [getPassword, onConfirmBackup, setLoadingStateWithTimeout, onError]
  );

  return createBackup;
};
