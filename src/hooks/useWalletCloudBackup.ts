import { useCallback } from 'react';
import { Platform } from 'react-native';

import { analytics } from '@/analytics';
import { addWalletToCloudBackup, backupWalletToCloud } from '@/features/backup/backup';
import { getBackupErrorMessage } from '@/features/backup/getBackupErrorMessage';
import { backupsStore } from '@/features/backup/stores/backupsStore';
import { maybeAuthenticateWithPIN } from '@/features/local-auth/keychain';
import { CLOUD_BACKUP_ERRORS, getGoogleAccountUserData, isCloudBackupAvailable, login } from '@/handlers/cloudBackup';
import { WrappedAlert as Alert } from '@/helpers/alert';
import WalletBackupTypes from '@/helpers/walletBackupTypes';
import * as i18n from '@/languages';
import { logger, RainbowError } from '@/logger';
import { setWalletBackedUp, useWallets } from '@/state/wallets/walletsStore';
import { openInBrowser } from '@/utils/openInBrowser';

import { cloudPlatform } from '../utils/platform';

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
      if (Platform.OS === 'android') {
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
        const userError = getBackupErrorMessage(e);
        !!onError && onError(userError);
        logger.error(new RainbowError(`[useWalletCloudBackup]: error while trying to backup wallet to ${cloudPlatform}`, e));
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
        logger.error(new RainbowError('[useWalletCloudBackup]: error while trying to save wallet backup state', e));
        const userError = getBackupErrorMessage(new Error(CLOUD_BACKUP_ERRORS.WALLET_BACKUP_STATUS_UPDATE_FAILED));
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
