import { useRoute } from '@react-navigation/native';
import React from 'react';
import WalletTypes from '../../../helpers/walletTypes';
import { useWallets } from '../../../hooks';
import AlreadyBackedUpView from './AlreadyBackedUpView';
import NeedsBackupView from './NeedsBackupView';
// eslint-disable-next-line import/no-cycle
import WalletSelectionView from './WalletSelectionView';

const BackupSection = ({ navigation }) => {
  const { wallets, selectedWallet } = useWallets();
  const { params } = useRoute();
  const wallet_id = params?.wallet_id;
  const activeWallet = (wallet_id && wallets[wallet_id]) || selectedWallet;
  if (
    !wallet_id &&
    Object.keys(wallets).filter(
      key => wallets[key].type !== WalletTypes.readOnly
    ).length > 1
  ) {
    return <WalletSelectionView navigation={navigation} />;
  } else if (activeWallet.backedUp || activeWallet.imported) {
    return <AlreadyBackedUpView />;
  } else {
    return <NeedsBackupView />;
  }
};

export default BackupSection;
