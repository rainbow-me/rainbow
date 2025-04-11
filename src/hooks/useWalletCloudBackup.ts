import { analytics } from '@/analytics';
import { IS_ANDROID } from '@/env';
import { authenticateWithPIN } from '@/handlers/authentication';
import { CLOUD_BACKUP_ERRORS, getGoogleAccountUserData, isCloudBackupAvailable, login } from '@/handlers/cloudBackup';
import { WrappedAlert as Alert } from '@/helpers/alert';
import WalletBackupTypes from '@/helpers/walletBackupTypes';
import { getSupportedBiometryType } from '@/keychain';
import * as i18n from '@/languages';
import { logger, RainbowError } from '@/logger';
import { openInBrowser } from '@/utils/openInBrowser';
import { values } from 'lodash';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { backupWalletToCloud } from '../model/backup';
import { useWalletsStore } from '../redux/wallets';
import { cloudPlatform } from '../utils/platform';

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
  const wallets = useWalletsStore(state => state.wallets);

  const walletCloudBackup = useCallback(
    async ({
      onError,
      onSuccess,
      password,
      walletId,
    }: {
      handleNoLatestBackup?: () => void;
      handlePasswordNotFound?: () => void;
      onError?: (error: string, isDamaged?: boolean) => void;
      onSuccess?: (password: string) => void;
      password: string;
      walletId: string;
    }): Promise<boolean> => {
      if (IS_ANDROID) {
        try {
          await login();
          const userData = await getGoogleAccountUserData();
          if (!userData) {
            Alert.alert(i18n.t(i18n.l.back_up.errors.no_account_found));
            return false;
          }
        } catch (e) {
          logger.error(new RainbowError('[BackupSheetSectionNoProvider]: No account found'), {
            error: e,
          });
          Alert.alert(i18n.t(i18n.l.back_up.errors.no_account_found));
          return false;
        }
      } else {
        const isAvailable = await isCloudBackupAvailable();
        if (!isAvailable) {
          analytics.track(analytics.event.iCloudNotEnabled, {
            category: 'backup',
          });
          Alert.alert(
            i18n.t(i18n.l.modal.back_up.alerts.cloud_not_enabled.label),
            i18n.t(i18n.l.modal.back_up.alerts.cloud_not_enabled.description),
            [
              {
                onPress: () => {
                  openInBrowser('https://support.apple.com/en-us/HT204025');
                  analytics.track(analytics.event.viewHowToEnableICloud, {
                    category: 'backup',
                  });
                },
                text: i18n.t(i18n.l.modal.back_up.alerts.cloud_not_enabled.show_me),
              },
              {
                onPress: () => {
                  analytics.track(analytics.event.ignoreHowToEnableICloud, {
                    category: 'backup',
                  });
                },
                style: 'cancel',
                text: i18n.t(i18n.l.modal.back_up.alerts.cloud_not_enabled.no_thanks),
              },
            ]
          );
          return false;
        }
      }

      const wallet = wallets?.[walletId];
      if (wallet?.damaged) {
        onError?.(i18n.t(i18n.l.back_up.errors.damaged_wallet), true);
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
      logger.debug('[useWalletCloudBackup]: password fetched correctly');

      let updatedBackupFile = null;

      try {
        logger.debug(`[useWalletCloudBackup]: backing up to ${cloudPlatform}: ${(wallets || {})[walletId]}`);
        updatedBackupFile = await backupWalletToCloud({
          password,
          wallet: (wallets || {})[walletId],
          userPIN,
        });
      } catch (e: any) {
        const userError = getUserError(e);
        !!onError && onError(userError);
        logger.error(new RainbowError(`[useWalletCloudBackup]: error while trying to backup wallet to ${cloudPlatform}: ${e}`));
        analytics.track(
          cloudPlatform === 'Google Drive' ? analytics.event.errorDuringGoogleDriveBackup : analytics.event.errorDuringICloudBackup,
          {
            category: 'backup',
            error: userError,
            label: cloudPlatform,
          }
        );
        return false;
      }

      try {
        logger.debug('[useWalletCloudBackup]: backup completed!');
        useWalletsStore.getState().setWalletBackedUp(walletId, WalletBackupTypes.cloud, updatedBackupFile);
        logger.debug('[useWalletCloudBackup]: backup saved everywhere!');
        !!onSuccess && onSuccess(password);
        return true;
      } catch (e) {
        logger.error(new RainbowError(`[useWalletCloudBackup]: error while trying to save wallet backup state: ${e}`));
        const userError = getUserError(new Error(CLOUD_BACKUP_ERRORS.WALLET_BACKUP_STATUS_UPDATE_FAILED));
        !!onError && onError(userError);
        analytics.track(analytics.event.errorUpdatingBackupStatus, {
          category: 'backup',
          label: cloudPlatform,
        });
      }

      return false;
    },
    [wallets]
  );

  return walletCloudBackup;
}
