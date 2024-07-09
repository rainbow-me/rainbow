/* eslint-disable no-promise-executor-return */
import { useCallback, useState } from 'react';
import { backupAllWalletsToCloud, getLocalBackupPassword, saveLocalBackupPassword } from '@/model/backup';
import { useCloudBackups } from './CloudBackupProvider';
import { cloudPlatform } from '@/utils/platform';
import { analytics } from '@/analytics';
import { useWalletCloudBackup, useWallets } from '@/hooks';
import Routes from '@/navigation/routesNames';
import walletBackupStepTypes from '@/helpers/walletBackupStepTypes';
import { Navigation, useNavigation } from '@/navigation';
import { InteractionManager } from 'react-native';
import { DelayedAlert } from '../alerts';
import { useDispatch } from 'react-redux';
import { AllRainbowWallets } from '@/model/wallet';

type UseCreateBackupProps = {
  walletId?: string;
  navigateToRoute?: {
    route: string;
    params?: any;
  };
};

export type useCreateBackupStateType = 'none' | 'loading' | 'success' | 'error';

export enum BackupTypes {
  Single = 'single',
  All = 'all',
}

export const useCreateBackup = ({ walletId, navigateToRoute }: UseCreateBackupProps) => {
  const dispatch = useDispatch();
  const { navigate } = useNavigation();

  const { fetchBackups } = useCloudBackups();
  const walletCloudBackup = useWalletCloudBackup();
  const { latestBackup, wallets } = useWallets();
  const [loading, setLoading] = useState<useCreateBackupStateType>('none');

  const [password, setPassword] = useState('');

  const setLoadingStateWithTimeout = useCallback(
    (state: useCreateBackupStateType, resetInMS = 2500) => {
      setLoading(state);
      setTimeout(() => {
        setLoading('none');
      }, resetInMS);
    },
    [setLoading]
  );
  const onSuccess = useCallback(async () => {
    const hasSavedPassword = await getLocalBackupPassword();
    if (!hasSavedPassword) {
      await saveLocalBackupPassword(password);
    }
    analytics.track('Backup Complete', {
      category: 'backup',
      label: cloudPlatform,
    });
    setLoadingStateWithTimeout('success');
    fetchBackups();
  }, [setLoadingStateWithTimeout, fetchBackups, password]);

  const onError = useCallback(
    (msg: string) => {
      InteractionManager.runAfterInteractions(async () => {
        DelayedAlert({ title: msg }, 500);
        setLoadingStateWithTimeout('error', 5000);
      });
    },
    [setLoadingStateWithTimeout]
  );

  const onConfirmBackup = useCallback(
    async ({ password, type }: { password: string; type: BackupTypes }) => {
      analytics.track('Tapped "Confirm Backup"');
      setLoading('loading');

      if (type === BackupTypes.All) {
        if (!wallets) {
          onError('Error loading wallets. Please try again.');
          setLoading('error');
          return;
        }
        backupAllWalletsToCloud({
          wallets: wallets as AllRainbowWallets,
          password,
          latestBackup,
          onError,
          onSuccess,
          dispatch,
        });
        return;
      }

      if (!walletId) {
        onError('Wallet not found. Please try again.');
        setLoading('error');
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
    [walletId, walletCloudBackup, onError, onSuccess, navigateToRoute, wallets, latestBackup, dispatch, navigate]
  );

  const getPassword = useCallback(async (): Promise<string | null> => {
    const password = await getLocalBackupPassword();
    if (password) {
      setPassword(password);
      return password;
    }

    return new Promise(resolve => {
      return Navigation.handleAction(Routes.BACKUP_SHEET, {
        nativeScreen: true,
        step: walletBackupStepTypes.backup_cloud,
        onSuccess: async (password: string) => {
          setPassword(password);
          resolve(password);
        },
        onCancel: async () => {
          resolve(null);
        },
        walletId,
      });
    });
  }, [walletId]);

  const onSubmit = useCallback(
    async ({ type = BackupTypes.Single }: { type?: BackupTypes }) => {
      const password = await getPassword();
      if (password) {
        onConfirmBackup({
          password,
          type,
        });
        return true;
      }
      setLoadingStateWithTimeout('error');
      return false;
    },
    [getPassword, onConfirmBackup, setLoadingStateWithTimeout]
  );

  return { onSuccess, onError, onSubmit, loading };
};
