import WalletBackupTypes from '@/helpers/walletBackupTypes';
import WalletTypes from '@/helpers/walletTypes';
import { useWallets } from '@/hooks';
import { isEmpty } from 'lodash';
import { BackupFile, CloudBackups, parseTimestampFromFilename } from '@/model/backup';
import * as i18n from '@/languages';
import { cloudPlatform } from '@/utils/platform';
import { backupsStore, CloudBackupState } from '@/state/backups/backups';
import { RainbowWallet } from '@/model/wallet';
import { IS_ANDROID, IS_IOS } from '@/env';
import { normalizeAndroidBackupFilename } from '@/handlers/cloudBackup';
import { format } from 'date-fns';

type WalletBackupStatus = {
  allBackedUp: boolean;
  areBackedUp: boolean;
  canBeBackedUp: boolean;
};

export const hasManuallyBackedUpWallet = (wallets: ReturnType<typeof useWallets>['wallets']) => {
  if (!wallets) return false;
  return Object.values(wallets).some(wallet => wallet.backupType === WalletBackupTypes.manual);
};

export const checkLocalWalletsForBackupStatus = (
  wallets: ReturnType<typeof useWallets>['wallets'],
  backups: CloudBackups
): WalletBackupStatus => {
  if (!wallets || isEmpty(wallets)) {
    return {
      allBackedUp: false,
      areBackedUp: false,
      canBeBackedUp: false,
    };
  }

  // FOR ANDROID, we need to check if the current google account also has the backup file
  if (IS_ANDROID) {
    return Object.values(wallets).reduce<WalletBackupStatus>(
      (acc, wallet) => {
        const isBackupEligible = wallet.type !== WalletTypes.readOnly && wallet.type !== WalletTypes.bluetooth;
        const hasBackupFile = backups.files.some(
          file => normalizeAndroidBackupFilename(file.name) === normalizeAndroidBackupFilename(wallet.backupFile ?? '')
        );

        return {
          allBackedUp: acc.allBackedUp && hasBackupFile && (wallet.backedUp || !isBackupEligible),
          areBackedUp: acc.areBackedUp && hasBackupFile && (wallet.backedUp || !isBackupEligible),
          canBeBackedUp: acc.canBeBackedUp && isBackupEligible,
        };
      },
      { allBackedUp: true, areBackedUp: true, canBeBackedUp: false }
    );
  }

  return Object.values(wallets).reduce<WalletBackupStatus>(
    (acc, wallet) => {
      const isBackupEligible = wallet.type !== WalletTypes.readOnly && wallet.type !== WalletTypes.bluetooth;

      return {
        allBackedUp: acc.allBackedUp && (wallet.backedUp || !isBackupEligible),
        areBackedUp: acc.areBackedUp && (wallet.backedUp || !isBackupEligible || wallet.imported),
        canBeBackedUp: acc.canBeBackedUp && isBackupEligible,
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

export const isWalletBackedUpForCurrentAccount = ({ backupType, backedUp, backupFile }: Partial<RainbowWallet>) => {
  if (IS_IOS || backupType === WalletBackupTypes.manual) {
    return backedUp;
  }

  if (!backupType || !backupFile) {
    return false;
  }

  // NOTE: For Android, we also need to check if the current google account has the matching backup file
  if (!backupFile) {
    return false;
  }

  const backupFiles = backupsStore.getState().backups;
  return backupFiles.files.some(file => normalizeAndroidBackupFilename(file.name) === normalizeAndroidBackupFilename(backupFile));
};

export const dateFormatter = (date: string | number, formatString = "M/d/yy 'at' h:mm a") => {
  try {
    return format(new Date(date), formatString);
  } catch (error) {
    return 'Unknown Date';
  }
};
