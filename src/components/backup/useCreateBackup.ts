/* eslint-disable no-promise-executor-return */
import { useCallback } from 'react';
import { backupAllWalletsToCloud, getLocalBackupPassword, saveLocalBackupPassword } from '@/model/backup';
import { backupsStore, CloudBackupState } from '@/state/backups/backups';
import { cloudPlatform } from '@/utils/platform';
import { analytics } from '@/analytics';
import { useWalletCloudBackup, useWallets } from '@/hooks';
import Routes from '@/navigation/routesNames';
import walletBackupStepTypes from '@/helpers/walletBackupStepTypes';
import { Navigation, useNavigation } from '@/navigation';
import { InteractionManager } from 'react-native';
import { DelayedAlert } from '@/components/alerts';
import { useDispatch } from 'react-redux';

type UseCreateBackupProps = {
  walletId?: string;
  navigateToRoute?: {
    route: string;
    params?: Record<string, unknown>;
  };
};

type ConfirmBackupProps = {
  password: string;
} & UseCreateBackupProps;

export const useCreateBackup = () => {
  const dispatch = useDispatch();
  const { navigate } = useNavigation();

  const walletCloudBackup = useWalletCloudBackup();
  const { wallets } = useWallets();

  const setLoadingStateWithTimeout = useCallback(
    ({ state, outOfSync = false, failInMs = 10_000 }: { state: CloudBackupState; outOfSync?: boolean; failInMs?: number }) => {
      backupsStore.getState().setStatus(state);
      if (outOfSync) {
        setTimeout(() => {
          backupsStore.getState().setStatus(CloudBackupState.Syncing);
        }, 1_000);
      }
      setTimeout(() => {
        const currentState = backupsStore.getState().status;
        if (currentState === state) {
          backupsStore.getState().setStatus(CloudBackupState.Ready);
        }
      }, failInMs);
    },
    []
  );

  const onSuccess = useCallback(
    async (password: string) => {
      const hasSavedPassword = await getLocalBackupPassword();
      if (!hasSavedPassword && password.trim()) {
        await saveLocalBackupPassword(password);
      }
      analytics.track('Backup Complete', {
        category: 'backup',
        label: cloudPlatform,
      });
      setLoadingStateWithTimeout({
        state: CloudBackupState.Success,
        outOfSync: true,
      });
      backupsStore.getState().syncAndFetchBackups();
    },
    [setLoadingStateWithTimeout]
  );

  const onError = useCallback(
    (msg: string) => {
      InteractionManager.runAfterInteractions(async () => {
        DelayedAlert({ title: msg }, 500);
        setLoadingStateWithTimeout({ state: CloudBackupState.Error });
      });
    },
    [setLoadingStateWithTimeout]
  );

  const onConfirmBackup = useCallback(
    async ({ password, walletId, navigateToRoute }: ConfirmBackupProps) => {
      analytics.track('Tapped "Confirm Backup"');
      backupsStore.getState().setStatus(CloudBackupState.InProgress);

      if (typeof walletId === 'undefined') {
        if (!wallets) {
          onError('Error loading wallets. Please try again.');
          backupsStore.getState().setStatus(CloudBackupState.Error);
          return;
        }
        backupAllWalletsToCloud({
          wallets,
          password,
          onError,
          onSuccess,
          dispatch,
        });
        return;
      }

      await walletCloudBackup({
        onError,
        onSuccess,
        password,
        walletId,
      });

      if (navigateToRoute) {
        navigate(navigateToRoute.route, navigateToRoute.params || {});
      }
    },
    [walletCloudBackup, onError, wallets, onSuccess, dispatch, navigate]
  );

  const getPassword = useCallback(async (props: UseCreateBackupProps): Promise<string | null> => {
    const password = await getLocalBackupPassword();
    if (password) {
      return password;
    }

    return new Promise(resolve => {
      return Navigation.handleAction(Routes.BACKUP_SHEET, {
        nativeScreen: true,
        step: walletBackupStepTypes.backup_cloud,
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

      const password = await getPassword(props);
      if (password) {
        onConfirmBackup({
          password,
          ...props,
        });
        return true;
      }
      setLoadingStateWithTimeout({
        state: CloudBackupState.Ready,
      });
      return false;
    },
    [getPassword, onConfirmBackup, setLoadingStateWithTimeout]
  );

  return createBackup;
};
