import WalletBackupTypes from '@/helpers/walletBackupTypes';
import WalletTypes from '@/helpers/walletTypes';
import { RainbowWallet } from '@/model/wallet';
import { Navigation } from '@/navigation';
import { BackupUserData, getLocalBackupPassword } from '@/model/backup';
import Routes from '@/navigation/routesNames';
import WalletBackupStepTypes from '@/helpers/walletBackupStepTypes';

type WalletsByKey = {
  [key: string]: RainbowWallet;
};

type WalletBackupStatus = {
  allBackedUp: boolean;
  areBackedUp: boolean;
  canBeBackedUp: boolean;
  backupProvider: string | undefined;
};

export const capitalizeFirstLetter = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const checkUserDataForBackupProvider = (userData?: BackupUserData): { backupProvider: string | undefined } => {
  let backupProvider: string | undefined = undefined;

  if (!userData?.wallets) return { backupProvider };

  Object.values(userData.wallets).forEach(wallet => {
    if (wallet.backedUp && wallet.type !== WalletTypes.readOnly) {
      if (wallet.backupType === WalletBackupTypes.cloud) {
        backupProvider = WalletBackupTypes.cloud;
      } else if (backupProvider !== WalletBackupTypes.cloud && wallet.backupType === WalletBackupTypes.manual) {
        backupProvider = WalletBackupTypes.manual;
      }
    }
  });

  return { backupProvider };
};

export const checkWalletsForBackupStatus = (wallets: WalletsByKey | null): WalletBackupStatus => {
  if (!wallets)
    return {
      allBackedUp: false,
      areBackedUp: false,
      canBeBackedUp: false,
      backupProvider: undefined,
    };

  let backupProvider: string | undefined = undefined;
  let areBackedUp = true;
  let canBeBackedUp = false;
  let allBackedUp = true;

  Object.keys(wallets).forEach(key => {
    if (wallets[key].backedUp && wallets[key].type !== WalletTypes.readOnly && wallets[key].type !== WalletTypes.bluetooth) {
      if (wallets[key].backupType === WalletBackupTypes.cloud) {
        backupProvider = WalletBackupTypes.cloud;
      } else if (backupProvider !== WalletBackupTypes.cloud && wallets[key].backupType === WalletBackupTypes.manual) {
        backupProvider = WalletBackupTypes.manual;
      }
    }

    if (!wallets[key].backedUp && wallets[key].type !== WalletTypes.readOnly && wallets[key].type !== WalletTypes.bluetooth) {
      allBackedUp = false;
    }

    if (
      !wallets[key].backedUp &&
      wallets[key].type !== WalletTypes.readOnly &&
      wallets[key].type !== WalletTypes.bluetooth &&
      !wallets[key].imported
    ) {
      areBackedUp = false;
    }

    if (wallets[key].type !== WalletTypes.bluetooth && wallets[key].type !== WalletTypes.readOnly) {
      canBeBackedUp = true;
    }
  });
  return {
    allBackedUp,
    areBackedUp,
    canBeBackedUp,
    backupProvider,
  };
};

export const getWalletsThatNeedBackedUp = (wallets: { [key: string]: RainbowWallet } | null): RainbowWallet[] => {
  if (!wallets) return [];
  const walletsToBackup: RainbowWallet[] = [];
  Object.keys(wallets).forEach(key => {
    if (
      !wallets[key].backedUp &&
      wallets[key].type !== WalletTypes.readOnly &&
      wallets[key].type !== WalletTypes.bluetooth &&
      !wallets[key].imported
    ) {
      walletsToBackup.push(wallets[key]);
    }
  });
  return walletsToBackup;
};

export const fetchBackupPasswordAndNavigate = async () => {
  const password = await getLocalBackupPassword();

  return new Promise(resolve => {
    return Navigation.handleAction(Routes.BACKUP_SHEET, {
      step: WalletBackupStepTypes.backup_cloud,
      password,
      onSuccess: async (password: string) => {
        resolve(password);
      },
    });
  });
};
