import React, { PropsWithChildren, createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { BackupUserData, CloudBackups } from '@/model/backup';
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

type CloudBackupContext = {
  backupState: CloudBackupState;
  backups: CloudBackups;
  userData: BackupUserData | undefined;
  createBackup: ReturnType<typeof useCreateBackup>;
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
  const [backupState, setBackupState] = useState(CloudBackupState.Initializing);

  const [userData, setUserData] = useState<BackupUserData>();
  const [backups, setBackups] = useState<CloudBackups>({
    files: [],
  });

  const syncAndFetchBackups = useCallback(async () => {
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
      setBackupState(CloudBackupState.Ready);

      logger.debug(`[CloudBackupProvider]: Retrieved ${backupFiles.files.length} backup files`);
      logger.debug(`[CloudBackupProvider]: Retrieved userData with ${Object.values(userData.wallets).length} wallets`);
    } catch (e) {
      logger.error(new RainbowError('[CloudBackupProvider]: Failed to fetch all backups'), {
        error: e,
      });
      setBackupState(CloudBackupState.FailedToInitialize);
    }
  }, [setBackupState]);

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
        backupState,
        backups,
        userData,
        createBackup,
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
