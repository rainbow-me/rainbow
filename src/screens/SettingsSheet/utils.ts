import { format } from 'date-fns';
import { isEmpty } from 'lodash';

import { IS_ANDROID, IS_IOS } from '@/env';
import { type CloudBackups } from '@/features/backup/backup';
import { backupsStore, CloudBackupState } from '@/features/backup/stores/backupsStore';
import { normalizeAndroidBackupFilename } from '@/handlers/cloudBackup';
import WalletBackupTypes from '@/helpers/walletBackupTypes';
import WalletTypes from '@/helpers/walletTypes';
import * as i18n from '@/languages';
import { type RainbowWallet } from '@/model/wallet';
import { getWallets } from '@/state/wallets/walletsStore';
import { cloudPlatform } from '@/utils/platform';

type WalletBackupStatus = {
  allBackedUp: boolean;
  areBackedUp: boolean;
  canBeBackedUp: boolean;
};

export const checkLocalWalletsForBackupStatus = (backups: CloudBackups): WalletBackupStatus => {
  const wallets = getWallets();
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
