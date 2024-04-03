import { captureException } from '@sentry/react-native';
import lang from 'i18n-js';
import { values } from 'lodash';
import { useCallback } from 'react';
import { Linking } from 'react-native';
import { useDispatch } from 'react-redux';
import { addWalletToCloudBackup, backupWalletToCloud } from '../model/backup';
import { setWalletBackedUp } from '../redux/wallets';
import { cloudPlatform } from '../utils/platform';
import useWallets from './useWallets';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { analytics } from '@/analytics';
import { CLOUD_BACKUP_ERRORS, isCloudBackupAvailable } from '@/handlers/cloudBackup';
import WalletBackupTypes from '@/helpers/walletBackupTypes';
import logger from '@/utils/logger';
import { getSupportedBiometryType } from '@/keychain';
import { IS_ANDROID } from '@/env';
import { authenticateWithPIN } from '@/handlers/authentication';
import * as i18n from '@/languages';

export function getUserError(e: Error) {
  switch (e.message) {
    case CLOUD_BACKUP_ERRORS.KEYCHAIN_ACCESS_ERROR:
      return i18n.t(i18n.l.back_up.errors.keychain_access);
    case CLOUD_BACKUP_ERRORS.ERROR_DECRYPTING_DATA:
      return i18n.t(i18n.l.back_up.errors.decrypting_data);
    case CLOUD_BACKUP_ERRORS.NO_BACKUPS_FOUND:
    case CLOUD_BACKUP_ERRORS.SPECIFIC_BACKUP_NOT_FOUND:
      return i18n.t(i18n.l.back_up.errors.no_backups_found);
    case CLOUD_BACKUP_ERRORS.ERROR_GETTING_ENCRYPTED_DATA:
      return i18n.t(i18n.l.back_up.errors.cant_get_encrypted_data);
    case CLOUD_BACKUP_ERRORS.MISSING_PIN:
      return i18n.t(i18n.l.back_up.errors.missing_pin);
    default:
      return i18n.t(i18n.l.back_up.errors.generic, {
        errorCodes: values(CLOUD_BACKUP_ERRORS).indexOf(e.message),
      });
  }
}

export default function useWalletCloudBackup() {
  const dispatch = useDispatch();
  const { latestBackup, wallets } = useWallets();

  const walletCloudBackup = useCallback(
    async ({
      onError,
      onSuccess,
      password,
      walletId,
    }: {
      handleNoLatestBackup?: () => void;
      handlePasswordNotFound?: () => void;
      onError?: (error: string) => void;
      onSuccess?: () => void;
      password: string;
      walletId: string;
    }): Promise<boolean> => {
      const isAvailable = await isCloudBackupAvailable();
      if (!isAvailable) {
        analytics.track('iCloud not enabled', {
          category: 'backup',
        });
        Alert.alert(lang.t('modal.back_up.alerts.cloud_not_enabled.label'), lang.t('modal.back_up.alerts.cloud_not_enabled.description'), [
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
        ]);
        return false;
      }

      // For Android devices without biometrics enabled, we need to ask for PIN
      let userPIN: string | undefined;
      const hasBiometricsEnabled = await getSupportedBiometryType();
      if (IS_ANDROID && !hasBiometricsEnabled) {
        try {
          userPIN = (await authenticateWithPIN()) ?? undefined;
        } catch (e) {
          onError?.(i18n.t(i18n.l.back_up.wrong_pin));
          return false;
        }
      }

      // We have the password and we need to add it to an existing backup
      logger.log('password fetched correctly');

      let updatedBackupFile = null;
      try {
        if (!latestBackup) {
          logger.log(`backing up to ${cloudPlatform}`, wallets![walletId]);
          updatedBackupFile = await backupWalletToCloud({
            password,
            wallet: wallets![walletId],
            userPIN,
          });
        } else {
          logger.log(`adding wallet to ${cloudPlatform} backup`, wallets![walletId]);
          updatedBackupFile = await addWalletToCloudBackup({
            password,
            wallet: wallets![walletId],
            filename: latestBackup,
            userPIN,
          });
        }
      } catch (e: any) {
        const userError = getUserError(e);
        !!onError && onError(userError);
        logger.sentry(`error while trying to backup wallet to ${cloudPlatform}`);
        captureException(e);
        analytics.track(`Error during ${cloudPlatform} Backup`, {
          category: 'backup',
          error: userError,
          label: cloudPlatform,
        });
        return false;
      }

      try {
        logger.log('backup completed!');
        await dispatch(setWalletBackedUp(walletId, WalletBackupTypes.cloud, updatedBackupFile));
        logger.log('backup saved everywhere!');
        !!onSuccess && onSuccess();
        return true;
      } catch (e) {
        logger.sentry('error while trying to save wallet backup state');
        captureException(e);
        const userError = getUserError(new Error(CLOUD_BACKUP_ERRORS.WALLET_BACKUP_STATUS_UPDATE_FAILED));
        !!onError && onError(userError);
        analytics.track('Error updating Backup status', {
          category: 'backup',
          label: cloudPlatform,
        });
      }

      return false;
    },
    [dispatch, latestBackup, wallets]
  );

  return walletCloudBackup;
}
