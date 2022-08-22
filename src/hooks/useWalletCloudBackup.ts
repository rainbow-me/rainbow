import { captureException } from '@sentry/react-native';
import lang from 'i18n-js';
import { useCallback } from 'react';
import { Linking } from 'react-native';
import { useDispatch } from 'react-redux';
import {
  addWalletToCloudBackup,
  backupWalletToCloud,
  fetchBackupPassword,
} from '../model/backup';
import { setWalletBackedUp } from '../redux/wallets';
import { cloudPlatform } from '../utils/platform';
import useWallets from './useWallets';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { analytics } from '@rainbow-me/analytics';
import { isCloudBackupAvailable } from '@rainbow-me/handlers/cloudBackup';
import { delay } from '@rainbow-me/helpers/utilities';
import WalletBackupTypes from '@rainbow-me/helpers/walletBackupTypes';
import { WalletLoadingStates } from '@rainbow-me/helpers/walletLoadingStates';
import match from '@rainbow-me/utils/match';
import { errorsCode, matchError } from '@rainbow-me/utils/matchError';
import logger from 'logger';

function getUserError(matched: any) {
  const errorText = match(
    '',
    [
      matched.CLOUD_BACKUP_ERROR_DECRYPTING_DATA,
      'Incorrect password! Please try again.',
    ],
    [
      matched.CLOUD_BACKUP_ERROR_GETTING_ENCRYPTED_DATA,
      `We couldn't access your backup at this time. Please try again later.`,
    ],
    [matched.CLOUD_BACKUP_GENERAL_ERROR, 'Backup failed'],
    [
      matched.CLOUD_BACKUP_INTEGRITY_CHECK_FAILED,
      'Backup integrity check failed',
    ],
    [
      matched.CLOUD_BACKUP_KEYCHAIN_ACCESS_ERROR,
      'You need to authenticate to proceed with the Backup process',
    ],
    [
      matched.CLOUD_BACKUP_NO_BACKUPS_FOUND,
      `We couldn't find your previous backup!`,
    ],
    [
      matched.CLOUD_BACKUP_SPECIFIC_BACKUP_NOT_FOUND,
      `We couldn't find your previous backup!`,
    ],
    [matched.CLOUD_BACKUP_UNKNOWN_ERROR, 'Unknown Error'],
    [
      matched.CLOUD_BACKUP_WALLET_BACKUP_STATUS_UPDATE_FAILED,
      'Update wallet backup status failed',
    ],
    [
      matched.KEYCHAIN_ERROR_AUTHENTICATING,
      lang.t('errors.keychain.error_authorization'),
    ],
    [
      matched.KEYCHAIN_NOT_AUTHENTICATED,
      lang.t('errors.keychain.not_authenticated'),
    ],
    [
      matched.DECRYPT_ANDROID_PIN_ERROR,
      lang.t('errors.keychain.decrypt_android_pin_error'),
    ]
  );
  return errorText;
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
          lang.t('modal.back_up.alerts.cloud_not_enabled.label'),
          lang.t('modal.back_up.alerts.cloud_not_enabled.description'),
          [
            {
              onPress: () => {
                Linking.openURL('https://support.apple.com/en-us/HT204025');
                analytics.track('View how to Enable iCloud', {
                  category: 'backup',
                });
              },
              text: lang.t('modal.back_up.alerts.cloud_not_enabled.show_me'),
            },
            {
              onPress: () => {
                analytics.track('Ignore how to enable iCloud', {
                  category: 'backup',
                });
              },
              style: 'cancel',
              text: lang.t('modal.back_up.alerts.cloud_not_enabled.no_thanks'),
            },
          ]
        );
        return;
      }

      if (!password && !latestBackup) {
        // No password, No latest backup meaning
        // it's a first time backup so we need to show the password sheet
        !!handleNoLatestBackup && handleNoLatestBackup();
        return;
      }

      let fetchedPassword = password;
      let wasPasswordFetched = false;
      if (latestBackup && !password) {
        // We have a backup but don't have the password, try fetching password
        setIsWalletLoading(WalletLoadingStates.FETCHING_PASSWORD);
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
        !!handlePasswordNotFound && handlePasswordNotFound();
        return;
      }

      setIsWalletLoading(WalletLoadingStates.BACKING_UP_WALLET);
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
          logger.log(`backing up to ${cloudPlatform}`, wallets![walletId]);
          updatedBackupFile = await backupWalletToCloud(
            fetchedPassword,
            wallets![walletId]
          );
        } else {
          logger.log(
            `adding wallet to ${cloudPlatform} backup`,
            wallets![walletId]
          );
          updatedBackupFile = await addWalletToCloudBackup(
            fetchedPassword,
            wallets![walletId],
            // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'string | true' is not assignable... Remove this comment to see the full error message
            latestBackup
          );
        }
      } catch (e: any) {
        const matched = matchError(e);
        const errorText = getUserError(matched);
        !!onError && onError(errorText);
        logger.sentry(
          `error while trying to backup wallet to ${cloudPlatform}`
        );
        captureException(e);
        analytics.track(`Error during ${cloudPlatform} Backup`, {
          category: 'backup',
          error: errorText,
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
        !!onSuccess && onSuccess();
      } catch (e) {
        logger.sentry('error while trying to save wallet backup state');
        captureException(e);

        const matched = matchError(
          errorsCode.CLOUD_BACKUP_WALLET_BACKUP_STATUS_UPDATE_FAILED
        );
        const errorText = getUserError(matched);
        !!onError && onError(errorText);
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
