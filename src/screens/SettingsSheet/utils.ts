import WalletBackupTypes from '@/helpers/walletBackupTypes';
import WalletTypes from '@/helpers/walletTypes';
import { useWallets } from '@/hooks';
import { isEmpty } from 'lodash';
import { BackupFile, parseTimestampFromFilename } from '@/model/backup';
import * as i18n from '@/languages';
import { cloudPlatform } from '@/utils/platform';
import { CloudBackupState } from '@/state/backups/backups';

type WalletBackupStatus = {
  allBackedUp: boolean;
  areBackedUp: boolean;
  canBeBackedUp: boolean;
};

export const hasManuallyBackedUpWallet = (wallets: ReturnType<typeof useWallets>['wallets']) => {
  if (!wallets) return false;
  return Object.values(wallets).some(wallet => wallet.backupType === WalletBackupTypes.manual);
};

export const checkLocalWalletsForBackupStatus = (wallets: ReturnType<typeof useWallets>['wallets']): WalletBackupStatus => {
  if (!wallets || isEmpty(wallets)) {
    return {
      allBackedUp: false,
      areBackedUp: false,
      canBeBackedUp: false,
    };
  }

  return Object.values(wallets).reduce<WalletBackupStatus>(
    (acc, wallet) => {
      const isBackupEligible = wallet.type !== WalletTypes.readOnly && wallet.type !== WalletTypes.bluetooth;

      return {
        allBackedUp: acc.allBackedUp && (wallet.backedUp || !isBackupEligible),
        areBackedUp: acc.areBackedUp && (wallet.backedUp || !isBackupEligible || wallet.imported),
        canBeBackedUp: acc.canBeBackedUp || isBackupEligible,
      };
    },
    { allBackedUp: true, areBackedUp: true, canBeBackedUp: false }
  );
};

export const getMostRecentCloudBackup = (backups: BackupFile[]) => {
  const cloudBackups = backups.sort((a, b) => {
    return parseTimestampFromFilename(b.name) - parseTimestampFromFilename(a.name);
  });

  return cloudBackups.reduce<BackupFile>((prev, current) => {
    if (!current) {
      return prev;
    }

    if (!prev) {
      return current;
    }

    const prevTimestamp = new Date(prev.lastModified).getTime();
    const currentTimestamp = new Date(current.lastModified).getTime();
    if (currentTimestamp > prevTimestamp) {
      return current;
    }

    return prev;
  }, cloudBackups[0]);
};

export const titleForBackupState: Partial<Record<CloudBackupState, string>> = {
  [CloudBackupState.Initializing]: i18n.t(i18n.l.back_up.cloud.syncing_cloud_store, {
    cloudPlatformName: cloudPlatform,
  }),
  [CloudBackupState.Syncing]: i18n.t(i18n.l.back_up.cloud.syncing_cloud_store, {
    cloudPlatformName: cloudPlatform,
  }),
  [CloudBackupState.Fetching]: i18n.t(i18n.l.back_up.cloud.fetching_backups, {
    cloudPlatformName: cloudPlatform,
  }),
};
