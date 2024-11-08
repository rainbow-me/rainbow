import React, { Dispatch, PropsWithChildren, SetStateAction, createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Backup, BackupUserData, CloudBackups } from '@/model/backup';
import {
  fetchAllBackups,
  fetchUserDataFromCloud,
  getGoogleAccountUserData,
  isCloudBackupAvailable,
  syncCloud,
} from '@/handlers/cloudBackup';
import { RainbowError, logger } from '@/logger';
import { IS_ANDROID } from '@/env';
import { useCreateBackup } from '@/components/backup/useCreateBackup';
import walletBackupTypes from '@/helpers/walletBackupTypes';
import { getMostRecentCloudBackup, hasManuallyBackedUpWallet } from '@/screens/SettingsSheet/utils';
import { useWallets } from '@/hooks';
import { Semaphore } from 'async-mutex';

const semaphore = new Semaphore(1);

type CloudBackupContext = {
  provider: string | undefined;
  setProvider: Dispatch<SetStateAction<string | undefined>>;
  backupState: CloudBackupState;
  backups: CloudBackups;
  userData: BackupUserData | undefined;
  mostRecentBackup: Backup | undefined;
  password: string;
  setPassword: Dispatch<SetStateAction<string>>;
  createBackup: ReturnType<typeof useCreateBackup>;
  syncAndFetchBackups: () => Promise<void>;
};

export enum CloudBackupState {
  Initializing = 'initializing',
  Syncing = 'syncing',
  Fetching = 'fetching',
  FailedToInitialize = 'failed_to_initialize', // Failed to initialize cloud backup
  Ready = 'ready',
  NotAvailable = 'not_available', // iCloud / Google Drive not available
  InProgress = 'in_progress', // Backup in progress
  Error = 'error',
  Success = 'success',
}

const CloudBackupContext = createContext({} as CloudBackupContext);

export function CloudBackupProvider({ children }: PropsWithChildren) {
  const { wallets } = useWallets();
  const [backupState, setBackupState] = useState(CloudBackupState.Initializing);

  const [userData, setUserData] = useState<BackupUserData>();
  const [backups, setBackups] = useState<CloudBackups>({
    files: [],
  });

  const [password, setPassword] = useState<string>('');

  const [mostRecentBackup, setMostRecentBackup] = useState<Backup | undefined>(undefined);
  const [provider, setProvider] = useState<string | undefined>(undefined);

  const syncAndPullFiles = useCallback(async () => {
    try {
      const isAvailable = await isCloudBackupAvailable();
      if (!isAvailable) {
        logger.debug('[CloudBackupProvider]: Cloud backup is not available');
        setBackupState(CloudBackupState.NotAvailable);
        return;
      }

      if (IS_ANDROID) {
        const gdata = await getGoogleAccountUserData();
        if (!gdata) {
          logger.debug('[CloudBackupProvider]: Google account is not available');
          setBackupState(CloudBackupState.NotAvailable);
          return;
        }
      }

      setBackupState(CloudBackupState.Syncing);
      logger.debug('[CloudBackupProvider]: Syncing with cloud');
      await syncCloud();

      setBackupState(CloudBackupState.Fetching);
      logger.debug('[CloudBackupProvider]: Fetching user data');
      const [userData, backupFiles] = await Promise.all([fetchUserDataFromCloud(), fetchAllBackups()]);
      setUserData(userData);
      setBackups(backupFiles);
      // if the user has any cloud backups, set the provider to cloud
      if (backupFiles.files.length > 0) {
        setProvider(walletBackupTypes.cloud);
        setMostRecentBackup(getMostRecentCloudBackup(backupFiles.files));
      } else if (hasManuallyBackedUpWallet(wallets)) {
        // if the user has manually backed up wallets, set the provider to manual
        setProvider(walletBackupTypes.manual);
      } // else it'll remain undefined

      logger.debug(`[CloudBackupProvider]: Retrieved ${backupFiles.files.length} backup files`);
      logger.debug(`[CloudBackupProvider]: Retrieved userData with ${Object.values(userData.wallets).length} wallets`);

      setBackupState(CloudBackupState.Ready);
    } catch (e) {
      logger.error(new RainbowError('[CloudBackupProvider]: Failed to fetch all backups'), {
        error: e,
      });
      setBackupState(CloudBackupState.FailedToInitialize);
    }
  }, [wallets]);

  const syncAndFetchBackups = useCallback(async () => {
    return semaphore.runExclusive(syncAndPullFiles);
  }, [syncAndPullFiles]);

  const createBackup = useCreateBackup({
    setBackupState,
    backupState,
    syncAndFetchBackups,
  });

  useEffect(() => {
    syncAndFetchBackups();

    return () => {
      setBackupState(CloudBackupState.Initializing);
    };
  }, [syncAndFetchBackups]);

  return (
    <CloudBackupContext.Provider
      value={{
        provider,
        setProvider,
        backupState,
        backups,
        userData,
        mostRecentBackup,
        password,
        setPassword,
        createBackup,
        syncAndFetchBackups,
      }}
    >
      {children}
    </CloudBackupContext.Provider>
  );
}

export function useCloudBackupsContext() {
  const context = useContext(CloudBackupContext);
  if (context === null) {
    throw new Error('useCloudBackups must be used within a CloudBackupProvider');
  }
  return context;
}
