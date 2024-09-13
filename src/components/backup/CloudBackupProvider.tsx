import React, { PropsWithChildren, createContext, useContext, useEffect, useState } from 'react';
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

type CloudBackupContext = {
  isFetching: boolean;
  backups: CloudBackups;
  fetchBackups: () => Promise<void>;
  userData: BackupUserData | undefined;
};

const CloudBackupContext = createContext({} as CloudBackupContext);

export function CloudBackupProvider({ children }: PropsWithChildren) {
  const [isFetching, setIsFetching] = useState(false);
  const [backups, setBackups] = useState<CloudBackups>({
    files: [],
  });

  const [userData, setUserData] = useState<BackupUserData>();

  const fetchBackups = async () => {
    try {
      setIsFetching(true);
      const isAvailable = await isCloudBackupAvailable();
      if (!isAvailable) {
        logger.debug('[CloudBackupProvider]: Cloud backup is not available');
        setIsFetching(false);
        return;
      }

      if (IS_ANDROID) {
        const gdata = await getGoogleAccountUserData();
        if (!gdata) {
          return;
        }
      }

      logger.debug('[CloudBackupProvider]: Syncing with cloud');
      await syncCloud();

      logger.debug('[CloudBackupProvider]: Fetching user data');
      const userData = await fetchUserDataFromCloud();
      setUserData(userData);

      logger.debug('[CloudBackupProvider]: Fetching all backups');
      const backups = await fetchAllBackups();

      logger.debug(`[CloudBackupProvider]: Retrieved ${backups.files.length} backup files`);
      setBackups(backups);
    } catch (e) {
      logger.error(new RainbowError('[CloudBackupProvider]: Failed to fetch all backups'), {
        error: e,
      });
    }
    setIsFetching(false);
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const value = {
    isFetching,
    backups,
    fetchBackups,
    userData,
  };

  return <CloudBackupContext.Provider value={value}>{children}</CloudBackupContext.Provider>;
}

export function useCloudBackups() {
  const context = useContext(CloudBackupContext);
  if (context === null) {
    throw new Error('useCloudBackups must be used within a CloudBackupProvider');
  }
  return context;
}
