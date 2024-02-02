import { useCallback } from 'react';
import { InteractionManager, Keyboard } from 'react-native';

import { saveBackupPassword } from '@/model/backup';
import useCloudBackups from '@/hooks/useCloudBackups';
import { useNavigation } from '@react-navigation/native';
import { DelayedAlert } from '@/components/alerts';
import * as lang from '@/languages';
import { cloudPlatform } from '@/utils/platform';
import { analytics } from '@/analytics';
import { useWalletCloudBackup } from '@/hooks';
import Routes from '@/navigation/routesNames';

type UseCreateBackupProps = {
  password: string;
  validPassword: boolean;
  walletId: string;
  isSettingsRoute: boolean;
};

export const useCreateBackup = ({
  password,
  validPassword,
  walletId,
  isSettingsRoute,
}: UseCreateBackupProps) => {
  const { goBack, navigate } = useNavigation();
  const { fetchBackups } = useCloudBackups();
  const walletCloudBackup = useWalletCloudBackup();

  const onSuccess = useCallback(async () => {
    await saveBackupPassword(password);
    if (!isSettingsRoute) {
      DelayedAlert({ title: lang.t(lang.l.cloud.backup_success) }, 1000);
    }
    analytics.track('Backup Complete', {
      category: 'backup',
      label: cloudPlatform,
    });
    fetchBackups();
    goBack();
  }, [password, goBack, isSettingsRoute, fetchBackups]);

  const onError = useCallback((msg: string) => {
    DelayedAlert({ title: msg }, 500);
  }, []);

  const onConfirmBackup = useCallback(async () => {
    analytics.track('Tapped "Confirm Backup"');

    await walletCloudBackup({
      onError,
      onSuccess,
      password,
      walletId,
    });
  }, [onError, onSuccess, password, walletCloudBackup, walletId]);

  const showExplainerConfirmation = useCallback(async () => {
    android && Keyboard.dismiss();
    navigate(Routes.EXPLAIN_SHEET, {
      onClose: () => {
        InteractionManager.runAfterInteractions(() => {
          setTimeout(() => {
            onConfirmBackup();
          }, 300);
        });
      },
      type: 'backup',
    });
  }, [navigate, onConfirmBackup]);

  const onSubmit = useCallback(() => {
    validPassword && showExplainerConfirmation();
  }, [showExplainerConfirmation, validPassword]);

  return { onSuccess, onError, onSubmit };
};
