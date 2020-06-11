import React from 'react';
import WalletTypes from '../../../helpers/walletTypes';
import { useWallets } from '../../../hooks';
import AlreadyBackedUpView from './AlreadyBackedUpView';
import NeedsBackupView from './NeedsBackupView';
import WalletSelectionView from './WalletSelectionView';

const BackupSection = ({ navigation }) => {
  const { wallets, selectedWallet } = useWallets();

  if (
    Object.keys(wallets).filter(
      key => wallets[key].type !== WalletTypes.readOnly
    ).length > 1
  ) {
    return <WalletSelectionView navigation={navigation} />;
  } else if (selectedWallet.backedUp) {
    return <AlreadyBackedUpView />;
  } else {
    return <NeedsBackupView />;
  }
};

export default BackupSection;
