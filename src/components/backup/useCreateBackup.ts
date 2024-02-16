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

type UseCreateBackupProps = {
  walletId: string;
};

export type useCreateBackupStateType = 'none' | 'loading' | 'success' | 'error';

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
    async (password: string) => {
      analytics.track('Tapped "Confirm Backup"');
      setLoading('loading');
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

  const onSubmit = useCallback(async () => {
    const password = await getPassword();
    if (password) {
      onConfirmBackup(password);
      return;
    }
    setLoadingStateWithTimeout('error');
  }, [getPassword, onConfirmBackup, setLoadingStateWithTimeout]);

  return { onSuccess, onError, onSubmit, loading };
};
