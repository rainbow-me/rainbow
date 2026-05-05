import { memo, useEffect } from 'react';

import { backupsStore } from '@/features/backup/stores/backupsStore';

const BackupsSyncComponent = () => {
  useEffect(() => {
    backupsStore.getState().syncAndFetchBackups();
  }, []);

  return null;
};

export const BackupsSync = memo(BackupsSyncComponent);
