import { isEmpty } from 'lodash';
import { useSelector } from 'react-redux';
import WalletBackupTypes from '../helpers/walletBackupTypes';
import WalletTypes from '../helpers/walletTypes';

export default function useWallets() {
  const { isWalletLoading, selectedWallet, walletNames, wallets } = useSelector(
    ({ wallets: { isWalletLoading, selected, walletNames, wallets } }) => ({
      isWalletLoading,
      selectedWallet: selected || {},
      walletNames,
      wallets,
    })
  );

  let latestBackup = false;
  let latestBackupDate = null;
  if (!isEmpty(wallets)) {
    Object.keys(wallets).forEach(key => {
      const wallet = wallets[key];
      // Check if there's a wallet backed up
      if (wallet.backedUp && wallet.backupType === WalletBackupTypes.cloud) {
        // If there is one, let's grab the latest backup
        if (!latestBackupDate || wallet.backupDate > latestBackupDate) {
          latestBackup = wallet.backupFile;
          latestBackupDate = wallet.backupDate;
        }
      }
    });
  }

  return {
    isReadOnlyWallet: selectedWallet.type === WalletTypes.readOnly,
    isWalletLoading,
    latestBackup,
    selectedWallet,
    walletNames,
    wallets,
  };
}
