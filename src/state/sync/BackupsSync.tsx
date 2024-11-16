import { useEffect, memo } from 'react';
import { backupsStore } from '@/state/backups/backups';

const BackupsSyncComponent = () => {
  useEffect(() => {
    backupsStore.getState().syncAndFetchBackups();
  }, []);

  return null;
};

export const BackupsSync = memo(BackupsSyncComponent);
