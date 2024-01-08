import WalletBackupTypes from '@/helpers/walletBackupTypes';
import WalletTypes from '@/helpers/walletTypes';
import { RainbowWallet } from '@/model/wallet';

export const capitalizeFirstLetter = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const checkWalletsForBackupStatus = (
  wallets: { [key: string]: RainbowWallet } | null
) => {
  if (!wallets)
    return {
      allBackedUp: false,
      areBackedUp: false,
      canBeBackedUp: false,
      hasManualBackup: false,
    };
  let areBackedUp = true;
  let canBeBackedUp = false;
  let allBackedUp = true;
  let hasManualBackup = false;

  Object.keys(wallets).forEach(key => {
    if (
      !wallets[key].backedUp &&
      wallets[key].type !== WalletTypes.readOnly &&
      wallets[key].type !== WalletTypes.bluetooth
    ) {
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
    if (
      wallets[key].type !== WalletTypes.readOnly &&
      wallets[key].type !== WalletTypes.readOnly
    ) {
      canBeBackedUp = true;
    }

    if (
      wallets[key].backedUp &&
      wallets[key].backupType === WalletBackupTypes.manual &&
      wallets[key].type !== WalletTypes.readOnly &&
      wallets[key].type !== WalletTypes.bluetooth &&
      !wallets[key].imported
    ) {
      hasManualBackup = true;
    }
  });
  return { allBackedUp, areBackedUp, canBeBackedUp, hasManualBackup };
};

export const getWalletsThatNeedBackedUp = (
  wallets: { [key: string]: RainbowWallet } | null
): RainbowWallet[] => {
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
