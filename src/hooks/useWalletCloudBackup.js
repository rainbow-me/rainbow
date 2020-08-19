import { captureException } from '@sentry/react-native';
import { keys } from 'lodash';
import { useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import { useDispatch } from 'react-redux';
import {
  CLOUD_BACKUP_ERRORS,
  isCloudBackupAvailable,
} from '../handlers/cloudBackup';
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

function getUserError(e) {
  switch (e.message) {
    case CLOUD_BACKUP_ERRORS.KEYCHAIN_ACCESS_ERROR:
      return 'You need to authenticate to proceed with the Backup process';
    case CLOUD_BACKUP_ERRORS.ERROR_DECRYPTING_DATA:
      return 'Incorrect password! Please try again.';
    case CLOUD_BACKUP_ERRORS.NO_BACKUPS_FOUND:
    case CLOUD_BACKUP_ERRORS.SPECIFIC_BACKUP_NOT_FOUND:
      return `We couldn't find your previous backup!`;
    case CLOUD_BACKUP_ERRORS.ERROR_GETTING_ENCRYPTED_DATA:
      return `We couldn't access your backup at this time. Please try again later.`;
    default:
      return `Error while trying to backup. Error code: ${keys(
        CLOUD_BACKUP_ERRORS
      ).indexOf(e.message)}`;
  }
}

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
          'iCloud Not Enabled',
          `Looks like iCloud drive is not enabled on your device.
          Do you want to see how to enable it?`,
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
        const userError = getUserError(e);
        onError && onError(userError);
        logger.sentry('error while trying to backup wallet to icloud');
        captureException(e);
      }

      try {
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
      } catch (e) {
        logger.sentry('error while trying to save wallet backup state');
        captureException(e);
        const userError = getUserError(
          new Error('update wallet backup status failed')
        );
        onError && onError(userError);
      }
    },
    [dispatch, latestBackup, wallets]
  );

  return walletCloudBackup;
}
