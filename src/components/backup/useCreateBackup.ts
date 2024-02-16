/* eslint-disable no-promise-executor-return */
import { useCallback, useState } from 'react';
import { InteractionManager, Keyboard } from 'react-native';

import { getLocalBackupPassword, saveLocalBackupPassword } from '@/model/backup';
import useCloudBackups from '@/hooks/useCloudBackups';
import { useNavigation } from '@react-navigation/native';
import { DelayedAlert } from '@/components/alerts';
import { cloudPlatform } from '@/utils/platform';
import { analytics } from '@/analytics';
import { useWalletCloudBackup } from '@/hooks';
import Routes from '@/navigation/routesNames';
import walletBackupStepTypes from '@/helpers/walletBackupStepTypes';
import { Navigation } from '@/navigation';

type UseCreateBackupProps = {
  walletId: string;
};

export const useCreateBackup = ({ walletId }: UseCreateBackupProps) => {
  const { goBack } = useNavigation();
  const { fetchBackups } = useCloudBackups();
  const walletCloudBackup = useWalletCloudBackup();

  const [password, setPassword] = useState('');

  const onSuccess = useCallback(async () => {
    await saveLocalBackupPassword(password);
    analytics.track('Backup Complete', {
      category: 'backup',
      label: cloudPlatform,
    });
    fetchBackups();
  }, [password, fetchBackups]);

  const onError = useCallback((msg: string) => {
    DelayedAlert({ title: msg }, 500);
  }, []);

  const onConfirmBackup = useCallback(
    async (password: string) => {
      analytics.track('Tapped "Confirm Backup"');

      await walletCloudBackup({
        onError,
        onSuccess,
        password,
        walletId,
      });
    },
    [onError, onSuccess, walletCloudBackup, walletId]
  );

  const getPassword = useCallback(async (): Promise<string> => {
    const password = await getLocalBackupPassword();
    if (password) {
      setPassword(password);
      return password;
    }

    return new Promise((resolve, reject) => {
      return Navigation.handleAction(Routes.BACKUP_SHEET, {
        nativeScreen: true,
        step: walletBackupStepTypes.backup_cloud,
        onSuccess: async (password: string) => {
          setPassword(password);
          goBack();
          resolve(password);
        },
        onCancel: async () => {
          reject();
        },
        walletId,
      });
    });
  }, [walletId, goBack]);

  const onSubmit = useCallback(async () => {
    const password = await getPassword();
    if (password) {
      onConfirmBackup(password);
    }
  }, [onConfirmBackup, getPassword]);

  return { onSuccess, onError, onSubmit };
};
