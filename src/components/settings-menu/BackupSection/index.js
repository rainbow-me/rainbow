import React from 'react';
import { useWallets } from '../../../hooks';
import AlreadyBackedUpView from './AlreadyBackedUpView';
import NeedsBackupView from './NeedsBackupView';
import WalletSelectionView from './WalletSelectionView';

const BackupSection = ({ navigation }) => {
  const { wallets, selected: selectedWallet } = useWallets();
  if (Object.keys(wallets).length > 1) {
    return <WalletSelectionView navigation={navigation} />;
  } else if (selectedWallet.isBackedUp) {
    return <AlreadyBackedUpView />;
  } else {
    return <NeedsBackupView />;
  }
};

export default BackupSection;
