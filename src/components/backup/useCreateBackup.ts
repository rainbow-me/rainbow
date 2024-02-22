/* eslint-disable no-promise-executor-return */
import { useCallback, useState } from 'react';
import { getLocalBackupPassword, saveLocalBackupPassword } from '@/model/backup';
import useCloudBackups from '@/hooks/useCloudBackups';
import { cloudPlatform } from '@/utils/platform';
import { analytics } from '@/analytics';
import { useWalletCloudBackup } from '@/hooks';
import Routes from '@/navigation/routesNames';
import walletBackupStepTypes from '@/helpers/walletBackupStepTypes';
import { Navigation } from '@/navigation';
import { InteractionManager } from 'react-native';
import { DelayedAlert } from '../alerts';
import { loadAllKeys } from '@/model/keychain';

type UseCreateBackupProps = {
  walletId?: string;
};

export type useCreateBackupStateType = 'none' | 'loading' | 'success' | 'error';

export enum BackupTypes {
  Single = 'single',
  All = 'all',
}

export const useCreateBackup = ({ walletId }: UseCreateBackupProps) => {
  const { fetchBackups } = useCloudBackups();
  const walletCloudBackup = useWalletCloudBackup();
  const [loading, setLoading] = useState<useCreateBackupStateType>('none');
  const [alreadyHasLocalPassword, setAlreadyHasLocalPassword] = useState(false);

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
    if (!alreadyHasLocalPassword) {
      await saveLocalBackupPassword(password);
    }
    analytics.track('Backup Complete', {
      category: 'backup',
      label: cloudPlatform,
    });
    setLoadingStateWithTimeout('success');
    fetchBackups();
  }, [alreadyHasLocalPassword, setLoadingStateWithTimeout, fetchBackups, password]);

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
    async (password: string, type: BackupTypes) => {
      analytics.track('Tapped "Confirm Backup"');
      setLoading('loading');

      if (type === BackupTypes.All) {
        const allKeys = await loadAllKeys();
        console.log(JSON.stringify(allKeys, null, 2));
        // TODO: Logic for fetch all keys and backup
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
    },
    [onError, onSuccess, walletCloudBackup, walletId]
  );

  const getPassword = useCallback(async (): Promise<string | null> => {
    const password = await getLocalBackupPassword();
    if (password) {
      setAlreadyHasLocalPassword(true);
      setPassword(password);
      return password;
    }

    return new Promise(resolve => {
      return Navigation.handleAction(Routes.BACKUP_SHEET, {
        nativeScreen: true,
        step: walletBackupStepTypes.backup_cloud,
        onSuccess: async (password: string) => {
          console.log('on success backup password step');
          setPassword(password);
          resolve(password);
        },
        onCancel: async () => {
          console.log('canceled backup password step');
          resolve(null);
        },
        walletId,
      });
    });
  }, [walletId]);

  const onSubmit = useCallback(
    async (type = BackupTypes.Single) => {
      const password = await getPassword();
      if (password) {
        onConfirmBackup(password, type);
        return;
      }
      setLoadingStateWithTimeout('error');
    },
    [getPassword, onConfirmBackup, setLoadingStateWithTimeout]
  );

  return { onSuccess, onError, onSubmit, loading };
};
