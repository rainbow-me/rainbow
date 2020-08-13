import { useNavigation } from '@react-navigation/core';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import walletBackupTypes from '../helpers/walletBackupTypes';
import walletLoadingStates from '../helpers/walletLoadingStates';
import { saveBackupPassword } from '../model/keychain';
import { addWalletToCloudBackup, backupWalletToCloud } from '../model/wallet';
import { setIsWalletLoading, setWalletBackedUp } from '../redux/wallets';
import useWallets from './useWallets';
import logger from 'logger';

export default function useWalletCloudBackup() {
  const dispatch = useDispatch();
  const { wallets } = useWallets();
  const { goBack } = useNavigation();

  const walletCloudBackup = useCallback(
    async ({ walletId, password, latestBackup, onError }) => {
      try {
        dispatch(setIsWalletLoading(walletLoadingStates.BACKING_UP_WALLET));

        let backupFile;
        if (!latestBackup) {
          logger.log(
            'walletCloudBackup:: backing up to icloud',
            wallets[walletId]
          );

          backupFile = await backupWalletToCloud(password, wallets[walletId]);
        } else {
          logger.log(
            'walletCloudBackup:: adding to icloud backup',
            wallets[walletId],
            latestBackup
          );
          backupFile = await addWalletToCloudBackup(
            password,
            wallets[walletId],
            latestBackup
          );
        }
        if (backupFile) {
          logger.log('walletCloudBackup:: saving backup password');
          await saveBackupPassword(password);
          logger.log('walletCloudBackup:: saved');

          logger.log('walletCloudBackup:: backup completed!', backupFile);
          await dispatch(
            setWalletBackedUp(walletId, walletBackupTypes.cloud, backupFile)
          );
          logger.log('walletCloudBackup:: backup saved everywhere!');
          goBack();
        } else {
          onError();
        }
      } catch (e) {
        onError(e);
      }
    },
    [wallets, dispatch, goBack]
  );

  return walletCloudBackup;
}
