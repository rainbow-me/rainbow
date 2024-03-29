import { useEffect, useState } from 'react';
import type { BackupUserData, CloudBackups } from '../model/backup';
import { fetchAllBackups, fetchUserDataFromCloud, isCloudBackupAvailable, syncCloud } from '@/handlers/cloudBackup';
import { RainbowError, logger } from '@/logger';

export const enum CloudBackupStep {
  IDLE,
  SYNCING,
  FETCHING_USER_DATA,
  FETCHING_ALL_BACKUPS,
  FAILED,
}

export default function useCloudBackups() {
  const [isFetching, setIsFetching] = useState(false);
  const [backups, setBackups] = useState<CloudBackups>({
    files: [],
  });

  const [step, setStep] = useState(CloudBackupStep.SYNCING);

  const [userData, setUserData] = useState<BackupUserData>();

  const fetchBackups = async () => {
    try {
      setIsFetching(true);
      const isAvailable = isCloudBackupAvailable();
      if (!isAvailable) {
        logger.log('Cloud backup is not available');
        setIsFetching(false);
        setStep(CloudBackupStep.IDLE);
        return;
      }

      setStep(CloudBackupStep.SYNCING);
      logger.log('Syncing with cloud');
      await syncCloud();

      setStep(CloudBackupStep.FETCHING_USER_DATA);
      logger.log('Fetching user data');
      const userData = await fetchUserDataFromCloud();
      setUserData(userData);

      setStep(CloudBackupStep.FETCHING_ALL_BACKUPS);
      logger.log('Fetching all backups');
      const backups = await fetchAllBackups();

      logger.log(`Retrieved ${backups.files.length} backup files`);
      setBackups(backups);
      setStep(CloudBackupStep.IDLE);
    } catch (e) {
      setStep(CloudBackupStep.FAILED);
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
    step,
  };
}
