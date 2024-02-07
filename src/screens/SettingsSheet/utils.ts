import WalletBackupTypes from '@/helpers/walletBackupTypes';
import WalletTypes from '@/helpers/walletTypes';
import { RainbowWallet } from '@/model/wallet';

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
    if (wallets[key].backedUp && wallets[key].type !== WalletTypes.readOnly) {
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
    if (wallets[key].type !== WalletTypes.readOnly && wallets[key].type !== WalletTypes.readOnly) {
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
