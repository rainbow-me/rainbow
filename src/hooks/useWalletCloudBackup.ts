import { analytics } from '@/analytics';
import { IS_ANDROID } from '@/env';
import { maybeAuthenticateWithPIN } from '@/handlers/authentication';
import { CLOUD_BACKUP_ERRORS, getGoogleAccountUserData, isCloudBackupAvailable, login } from '@/handlers/cloudBackup';
import { WrappedAlert as Alert } from '@/helpers/alert';
import WalletBackupTypes from '@/helpers/walletBackupTypes';
import * as i18n from '@/languages';
import { logger, RainbowError } from '@/logger';
import { backupsStore } from '@/state/backups/backups';
import { setWalletBackedUp, useWallets } from '@/state/wallets/walletsStore';
import { openInBrowser } from '@/utils/openInBrowser';
import { values } from 'lodash';
import { useCallback } from 'react';
import { addWalletToCloudBackup, backupWalletToCloud } from '../model/backup';
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
    case CLOUD_BACKUP_ERRORS.WRONG_PIN:
      return i18n.t(i18n.l.back_up.wrong_pin);
    default:
      return i18n.t(i18n.l.back_up.errors.generic, {
        errorCodes: values(CLOUD_BACKUP_ERRORS).indexOf(e.message),
      });
  }
}

export default function useWalletCloudBackup() {
  const wallets = useWallets();

  const walletCloudBackup = useCallback(
    async ({
      onError,
      onSuccess,
      password,
      walletId,
      addToCurrentBackup,
    }: {
      handleNoLatestBackup?: () => void;
      handlePasswordNotFound?: () => void;
      onError?: (error: string, isDamaged?: boolean) => void;
      onSuccess?: (password: string) => void;
      password: string;
      walletId: string;
      addToCurrentBackup: boolean;
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
      try {
        userPIN = await maybeAuthenticateWithPIN();
      } catch (e) {
        onError?.(i18n.t(i18n.l.back_up.wrong_pin));
        return false;
      }

      // We have the password and we need to add it to an existing backup
      logger.debug('[useWalletCloudBackup]: password fetched correctly');

      let updatedBackupFile = null;

      try {
        const currentBackup = backupsStore.getState().backups.files.at(0);
        if (addToCurrentBackup && currentBackup != null) {
          logger.debug(`[useWalletCloudBackup]: adding to existing backup to ${cloudPlatform} ${currentBackup.name}`, {
            wallet: (wallets || {})[walletId],
          });
          updatedBackupFile = await addWalletToCloudBackup({
            filename: currentBackup.name,
            password,
            wallet: (wallets || {})[walletId],
            userPIN,
          });
        } else {
          logger.debug(`[useWalletCloudBackup]: creating new backup to ${cloudPlatform}`, { wallet: (wallets || {})[walletId] });
          updatedBackupFile = await backupWalletToCloud({
            password,
            wallet: (wallets || {})[walletId],
            userPIN,
          });
        }
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
        setWalletBackedUp(walletId, WalletBackupTypes.cloud, updatedBackupFile);
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
