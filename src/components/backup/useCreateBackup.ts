/* eslint-disable no-promise-executor-return */
import { Dispatch, SetStateAction, useCallback, useMemo } from 'react';
import { backupAllWalletsToCloud, findLatestBackUp, getLocalBackupPassword, saveLocalBackupPassword } from '@/model/backup';
import { CloudBackupState } from '@/components/backup/CloudBackupProvider';
import { cloudPlatform } from '@/utils/platform';
import { analytics } from '@/analytics';
import { useWalletCloudBackup, useWallets } from '@/hooks';
import Routes from '@/navigation/routesNames';
import walletBackupStepTypes from '@/helpers/walletBackupStepTypes';
import { Navigation, useNavigation } from '@/navigation';
import { InteractionManager } from 'react-native';
import { DelayedAlert } from '@/components/alerts';
import { useDispatch } from 'react-redux';
import { AllRainbowWallets } from '@/model/wallet';

type SingleWalletBackupProps = {
  type: BackupTypes.Single;
  walletId: string;
};

type AllWalletsBackupProps = {
  type: BackupTypes.All;
  walletId?: undefined;
};

type UseCreateBackupProps = (SingleWalletBackupProps | AllWalletsBackupProps) & {
  navigateToRoute?: {
    route: string;
    params?: any;
  };
};

type ConfirmBackupProps = {
  password: string;
} & UseCreateBackupProps;

export enum BackupTypes {
  Single = 'single',
  All = 'all',
}

export const useCreateBackup = ({
  setBackupState,
  backupState,
  syncAndFetchBackups,
}: {
  setBackupState: Dispatch<SetStateAction<CloudBackupState>>;
  backupState: CloudBackupState;
  syncAndFetchBackups: () => Promise<void>;
}) => {
  const dispatch = useDispatch();
  const { navigate } = useNavigation();

  const walletCloudBackup = useWalletCloudBackup();
  const { wallets } = useWallets();
  const latestBackup = useMemo(() => findLatestBackUp(wallets), [wallets]);

  const setLoadingStateWithTimeout = useCallback(
    (state: CloudBackupState, failInMs = 10_000) => {
      setBackupState(state);
      setTimeout(() => {
        setBackupState(CloudBackupState.Ready);
      }, failInMs);
    },
    [setBackupState]
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
      setLoadingStateWithTimeout(CloudBackupState.Success);
      syncAndFetchBackups();
    },
    [setLoadingStateWithTimeout, syncAndFetchBackups]
  );

  const onError = useCallback(
    (msg: string) => {
      InteractionManager.runAfterInteractions(async () => {
        DelayedAlert({ title: msg }, 500);
        setLoadingStateWithTimeout(CloudBackupState.Error);
      });
    },
    [setLoadingStateWithTimeout]
  );

  const onConfirmBackup = useCallback(
    async ({ password, type, walletId, navigateToRoute }: ConfirmBackupProps) => {
      analytics.track('Tapped "Confirm Backup"');
      setBackupState(CloudBackupState.InProgress);

      if (type === BackupTypes.All) {
        if (!wallets) {
          onError('Error loading wallets. Please try again.');
          setBackupState(CloudBackupState.Error);
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
        setBackupState(CloudBackupState.Error);
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
    [setBackupState, walletCloudBackup, onError, wallets, latestBackup, onSuccess, dispatch, navigate]
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
      if (backupState !== CloudBackupState.Ready) {
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
      setLoadingStateWithTimeout(CloudBackupState.Ready);
      return false;
    },
    [backupState, getPassword, onConfirmBackup, setLoadingStateWithTimeout]
  );

  return createBackup;
};
