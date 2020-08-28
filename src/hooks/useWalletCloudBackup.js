import { captureException } from '@sentry/react-native';
import { useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import { useDispatch } from 'react-redux';
import { isCloudBackupAvailable } from '../handlers/cloudBackup';
import { delay } from '../helpers/utilities';
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
      let wasPasswordFetched = false;
      if (latestBackup && !password) {
        // We have a backup but don't have the password, try fetching password
        dispatch(setIsWalletLoading(walletLoadingStates.FETCHING_PASSWORD));
        // We want to make it clear why are we requesting faceID twice
        // So we delayed it to make sure the user can read before seeing the auth prompt
        await delay(1500);
        fetchedPassword = await fetchBackupPassword();
        dispatch(setIsWalletLoading(null));
        await delay(300);
        wasPasswordFetched = true;
      }

      // If we still can't get the password, handle password not found
      if (!fetchedPassword) {
        handlePasswordNotFound && handlePasswordNotFound();
        return;
      }

      dispatch(setIsWalletLoading(walletLoadingStates.BACKING_UP_WALLET));
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
