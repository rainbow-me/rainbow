import { Migration, MigrationName } from '@/migrations/types';
// import {  } from '@/redux/wallets';
// import store from '@/redux/store';
import { logger } from '@/logger';
import { getAllWallets } from '@/model/wallet';
import { backups } from '@/storage';
import { BackupProvider, BackupStatus } from '@/storage/schema';
import WalletBackupTypes from '@/helpers/walletBackupTypes';

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
        case WalletBackupTypes.cloud:
          backups.set(['provider'], BackupProvider.CloudProvider);
          break;
        default:
          backups.set(['provider'], BackupProvider.NoProvider);
      }

      backups.set(
        ['lastBackupTimestamp'],
        wallet.backupDate || `${Date.now()}`
      );

      // TODO: Is this all that dictates an out of date backup?
      const allBackedUp = Object.values(wallets.wallets).every(w => w.backedUp);
      backups.set(
        ['status'],
        allBackedUp ? BackupStatus.UpToDate : BackupStatus.OutOfDate
      );
    },
  };
}
