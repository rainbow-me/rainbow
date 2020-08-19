import { captureException } from '@sentry/react-native';
import { useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import { useDispatch } from 'react-redux';
import { isCloudBackupAvailable } from '../handlers/cloudBackup';
import WalletBackupTypes from '../helpers/walletBackupTypes';
import walletLoadingStates from '../helpers/walletLoadingStates';
import {
  addWalletToCloudBackup,
  backupWalletToCloud,
  fetchBackupPassword,
} from '../model/backup';
import { setIsWalletLoading, setWalletBackedUp } from '../redux/wallets';
import useWallets from './useWallets';
import logger from 'logger';

export default function useWalletCloudBackup() {
  const dispatch = useDispatch();
  const { latestBackup, wallets } = useWallets();

  const walletCloudBackup = useCallback(
    async ({
      handleNoLatestBackup,
      handlePasswordNotFound,
      onError,
      onSuccess,
      password,
      walletId,
    }) => {
      const isAvailable = await isCloudBackupAvailable();
      if (!isAvailable) {
        Alert.alert(
          'iCloud Error',
          'Looks like iCloud drive is not enabled in your device. Do you want to see how to enable it?',
          [
            {
              onPress: () => {
                Linking.openURL('https://support.apple.com/en-us/HT204025');
              },
              text: 'Yes, Show me',
            },
            {
              style: 'cancel',
              text: 'No thanks',
            },
          ]
        );
        return;
      }

      if (!password && !latestBackup) {
        // No password, No latest backup meaning
        // it's a first time backup so we need to show the password sheet
        handleNoLatestBackup && handleNoLatestBackup();
        return;
      }

      let fetchedPassword = password;
      if (latestBackup && !password) {
        // We have a backup but don't have the password, try fetching password
        fetchedPassword = await fetchBackupPassword();
      }

      // If we still can't get the password, handle password not found
      if (!fetchedPassword) {
        handlePasswordNotFound && handlePasswordNotFound();
        return;
      }

      dispatch(setIsWalletLoading(walletLoadingStates.BACKING_UP_WALLET));

      // We have the password and we need to add it to an existing backup
      logger.log('password fetched correctly');

      let updatedBackupFile = null;
      try {
        if (!latestBackup) {
          logger.log('backing up to icloud', wallets[walletId]);
          updatedBackupFile = await backupWalletToCloud(
            fetchedPassword,
            wallets[walletId]
          );
        } else {
          logger.log('adding wallet to icloud backup', wallets[walletId]);
          updatedBackupFile = await addWalletToCloudBackup(
            fetchedPassword,
            wallets[walletId],
            latestBackup
          );
        }
      } catch (e) {
        onError && onError();
        logger.sentry('error while trying to backup wallet to icloud');
        captureException(e);
        setTimeout(() => {
          Alert.alert('Error while trying to backup');
        }, 500);
      }

      try {
        if (updatedBackupFile) {
          logger.log('backup completed!');
          await dispatch(
            setWalletBackedUp(
              walletId,
              WalletBackupTypes.cloud,
              updatedBackupFile
            )
          );
          logger.log('backup saved everywhere!');
          onSuccess && onSuccess();
        } else {
          onError && onError();
          setTimeout(() => {
            Alert.alert('Error while trying to backup');
          }, 500);
        }
      } catch (e) {
        logger.sentry('error while trying to save wallet backup state');
        captureException(e);
      }
    },
    [dispatch, latestBackup, wallets]
  );

  return walletCloudBackup;
}
