import { useEffect, useState } from 'react';
import type { CloudBackups } from '../model/backup';
import { fetchAllBackups, isCloudBackupAvailable, syncCloud } from '@/handlers/cloudBackup';
import { RainbowError, logger } from '@/logger';

export default function useCloudBackups() {
  const [backups, setBackups] = useState<CloudBackups>({
    files: [],
  });

  const fetchBackups = async () => {
    try {
      const isAvailable = isCloudBackupAvailable();
      if (!isAvailable) {
        logger.log('Cloud backup is not available');
        return;
      }

      logger.log('Syncing with cloud');
      await syncCloud();

      logger.log('Fetching all backups');
      const backups = await fetchAllBackups();

      logger.log(`Retrieved ${backups.files.length} backup files`);
      setBackups(backups);
    } catch (e) {
      logger.error(new RainbowError('Failed to fetch all backups'), {
        error: e,
      });
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  return {
    backups,
    fetchBackups,
  };
}
