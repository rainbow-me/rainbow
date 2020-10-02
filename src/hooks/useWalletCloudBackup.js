import analytics from '@segment/analytics-react-native';
import { captureException } from '@sentry/react-native';
import { values } from 'lodash';
import { useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import { useDispatch } from 'react-redux';
import {
  addWalletToCloudBackup,
  backupWalletToCloud,
  fetchBackupPassword,
} from '../model/backup';
import { setWalletBackedUp } from '../redux/wallets';
import { cloudPlatform } from '../utils/platform';
import useWallets from './useWallets';
import {
  CLOUD_BACKUP_ERRORS,
  isCloudBackupAvailable,
} from '@rainbow-me/handlers/cloudBackup';
import { delay } from '@rainbow-me/helpers/utilities';
import WalletBackupTypes from '@rainbow-me/helpers/walletBackupTypes';
import walletLoadingStates from '@rainbow-me/helpers/walletLoadingStates';
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
      return `Error while trying to backup. Error code: ${values(
        CLOUD_BACKUP_ERRORS
      ).indexOf(e.message)}`;
  }
}

export default function useWalletCloudBackup() {
  const dispatch = useDispatch();
  const { latestBackup, setIsWalletLoading, wallets } = useWallets();

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
        analytics.track('iCloud not enabled', {
          category: 'backup',
        });
        Alert.alert(
          'iCloud Not Enabled',
          `Looks like iCloud drive is not enabled on your device.
          Do you want to see how to enable it?`,
          [
            {
              onPress: () => {
                Linking.openURL('https://support.apple.com/en-us/HT204025');
                analytics.track('View how to Enable iCloud', {
                  category: 'backup',
                });
              },
              text: 'Yes, Show me',
            },
            {
              onPress: () => {
                analytics.track('Ignore how to enable iCloud', {
                  category: 'backup',
                });
              },
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
      let wasPasswordFetched = false;
      if (latestBackup && !password) {
        // We have a backup but don't have the password, try fetching password
        setIsWalletLoading(walletLoadingStates.FETCHING_PASSWORD);
        // We want to make it clear why are we requesting faceID twice
        // So we delayed it to make sure the user can read before seeing the auth prompt
        await delay(1500);
        fetchedPassword = await fetchBackupPassword();
        setIsWalletLoading(null);
        await delay(300);
        wasPasswordFetched = true;
      }

      // If we still can't get the password, handle password not found
      if (!fetchedPassword) {
        handlePasswordNotFound && handlePasswordNotFound();
        return;
      }

      setIsWalletLoading(walletLoadingStates.BACKING_UP_WALLET);
      // We want to make it clear why are we requesting faceID twice
      // So we delayed it to make sure the user can read before seeing the auth prompt
      if (wasPasswordFetched) {
        await delay(1500);
      }

      // We have the password and we need to add it to an existing backup
      logger.log('password fetched correctly');

      let updatedBackupFile = null;
      try {
        if (!latestBackup) {
          logger.log(`backing up to ${cloudPlatform}`, wallets[walletId]);
          updatedBackupFile = await backupWalletToCloud(
            fetchedPassword,
            wallets[walletId]
          );
        } else {
          logger.log(
            `adding wallet to ${cloudPlatform} backup`,
            wallets[walletId]
          );
          updatedBackupFile = await addWalletToCloudBackup(
            fetchedPassword,
            wallets[walletId],
            latestBackup
          );
        }
      } catch (e) {
        const userError = getUserError(e);
        onError && onError(userError);
        logger.sentry(
          `error while trying to backup wallet to ${cloudPlatform}`
        );
        captureException(e);
        analytics.track(`Error during ${cloudPlatform} Backup`, {
          category: 'backup',
          error: userError,
          label: cloudPlatform,
        });
        return null;
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
          new Error(CLOUD_BACKUP_ERRORS.WALLET_BACKUP_STATUS_UPDATE_FAILED)
        );
        onError && onError(userError);
        analytics.track('Error updating Backup status', {
          category: 'backup',
          label: cloudPlatform,
        });
      }
    },
    [dispatch, latestBackup, setIsWalletLoading, wallets]
  );

  return walletCloudBackup;
}
