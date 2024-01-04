import { Migration, MigrationName } from '@/migrations/types';
import { logger } from '@/logger';
import { getAllWallets } from '@/model/wallet';
import { backups } from '@/storage';
import { BackupProvider, BackupStatus } from '@/storage/schema';
import WalletBackupTypes from '@/helpers/walletBackupTypes';
import WalletTypes from '@/helpers/walletTypes';
import { findLatestBackUp } from '@/model/backup';

export function setInitialBackupMethod(): Migration {
  return {
    name: MigrationName.setInitialBackupMethod,
    async migrate() {
      const wallets = await getAllWallets();
      if (!wallets || !Object.values(wallets.wallets).length) {
        logger.log('No wallets found, skipping migration');
        return;
      }

      const wallet = Object.values(wallets.wallets).find(w => w.backedUp);
      if (!wallet) {
        logger.log('No wallet backup detected, setting default to no provider');
        backups.set(['provider'], BackupProvider.NoProvider);
        backups.set(['status'], BackupStatus.NoBackup);
        return;
      }

      const { backupType } = wallet;
      switch (backupType) {
        case WalletBackupTypes.manual:
          backups.set(['provider'], BackupProvider.ManualProvider);
          break;
        case WalletBackupTypes.cloud: {
          backups.set(['provider'], BackupProvider.CloudProvider);
          const latestBackup = findLatestBackUp(wallets.wallets);
          if (latestBackup) {
            backups.set(['lastBackupTimestamp'], latestBackup);
          }
          break;
        }
        default:
          backups.set(['provider'], BackupProvider.NoProvider);
      }

      const allBackedUp = Object.values(wallets.wallets).every(
        w => w.type !== WalletTypes.readOnly && w.backedUp
      );
      backups.set(
        ['status'],
        allBackedUp ? BackupStatus.UpToDate : BackupStatus.OutOfDate
      );
    },
  };
}
