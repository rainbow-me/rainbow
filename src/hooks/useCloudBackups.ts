import { useEffect, useState } from 'react';
import type { BackupUserData, CloudBackups } from '../model/backup';
import { fetchAllBackups, fetchUserDataFromCloud, isCloudBackupAvailable, syncCloud } from '@/handlers/cloudBackup';
import { RainbowError, logger } from '@/logger';

export default function useCloudBackups() {
  const [isFetching, setIsFetching] = useState(false);
  const [backups, setBackups] = useState<CloudBackups>({
    files: [],
  });

  const [userData, setUserData] = useState<BackupUserData>();

  const fetchBackups = async () => {
    try {
      setIsFetching(true);
      const isAvailable = isCloudBackupAvailable();
      if (!isAvailable) {
        logger.log('Cloud backup is not available');
        setIsFetching(false);
        return;
      }

      logger.log('Syncing with cloud');
      await syncCloud();

      logger.log('Fetching user data');
      const userData = await fetchUserDataFromCloud();
      setUserData(userData);

      logger.log('Fetching all backups');
      const backups = await fetchAllBackups();

      logger.log(`Retrieved ${backups.files.length} backup files`);
      setBackups(backups);
    } catch (e) {
      logger.error(new RainbowError('Failed to fetch all backups'), {
        error: e,
      });
    }
    setIsFetching(false);
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  return {
    isFetching,
    backups,
    fetchBackups,
    userData,
  };
}
