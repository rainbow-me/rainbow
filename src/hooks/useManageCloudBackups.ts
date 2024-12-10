import { useCallback, useEffect, useState } from 'react';
import lang from 'i18n-js';
import { useDispatch } from 'react-redux';
import { cloudPlatform } from '../utils/platform';
import { WrappedAlert as Alert } from '@/helpers/alert';
import {
  GoogleDriveUserData,
  getGoogleAccountUserData,
  deleteAllBackups,
  logoutFromGoogleDrive as logout,
  login,
} from '@/handlers/cloudBackup';
import { clearAllWalletsBackupStatus } from '@/redux/wallets';
import { showActionSheetWithOptions } from '@/utils';
import { IS_ANDROID } from '@/env';
import { RainbowError, logger } from '@/logger';
import * as i18n from '@/languages';
import { backupsStore, CloudBackupState } from '@/state/backups/backups';
import * as keychain from '@/keychain';
import { authenticateWithPIN } from '@/handlers/authentication';

export default function useManageCloudBackups() {
  const dispatch = useDispatch();
  const [accountDetails, setAccountDetails] = useState<GoogleDriveUserData | undefined>(undefined);

  useEffect(() => {
    getGoogleAccountUserData()
      .then(accountDetails => {
        setAccountDetails(accountDetails ?? undefined);
      })
      .catch(error => {
        logger.error(new RainbowError(`[useManageCloudBackups]: Error Fetching google account data for Backups Section`), {
          error: (error as Error).message,
        });
      });
  }, []);

  const manageCloudBackups = useCallback(() => {
    const buttons = [
      i18n.t(i18n.l.settings.delete_backups, { cloudPlatform }),
      IS_ANDROID ? i18n.t(i18n.l.settings.backup_switch_google_account) : undefined,
      i18n.t(i18n.l.button.cancel),
    ].filter(Boolean);

    const getTitleForPlatform = () => {
      if (IS_ANDROID && accountDetails?.email) {
        return i18n.t(i18n.l.settings.manage_backups, {
          cloudPlatformOrEmail: accountDetails.email,
        });
      }
      return i18n.t(i18n.l.settings.manage_backups, {
        cloudPlatformOrEmail: cloudPlatform,
      });
    };

    const removeBackupStateFromAllWallets = async () => {
      await dispatch(clearAllWalletsBackupStatus());
    };

    const logoutFromGoogleDrive = async () => {
      await logout();
      backupsStore.setState({
        backupProvider: undefined,
        backups: { files: [] },
        mostRecentBackup: undefined,
        status: CloudBackupState.NotAvailable,
      });
    };

    const loginToGoogleDrive = async () => {
      try {
        await login();
        const accountDetails = await getGoogleAccountUserData();
        backupsStore.getState().syncAndFetchBackups();
        setAccountDetails(accountDetails ?? undefined);
      } catch (error) {
        logger.error(new RainbowError(`[useManageCloudBackups]: Logging into Google Drive failed.`), {
          error: (error as Error).message,
        });
      }
    };

    showActionSheetWithOptions(
      {
        cancelButtonIndex: IS_ANDROID ? 2 : 1,
        destructiveButtonIndex: IS_ANDROID ? 0 : 1,
        options: buttons,
        title: getTitleForPlatform(),
      },
      async (_buttonIndex: number) => {
        if (_buttonIndex === 0) {
          showActionSheetWithOptions(
            {
              cancelButtonIndex: 1,
              destructiveButtonIndex: 0,
              message: i18n.t(i18n.l.settings.confirm_delete_backups_description, { cloudPlatform }),
              options: [i18n.t(i18n.l.settings.confirm_delete_backups), i18n.t(i18n.l.button.cancel)],
            },
            async (buttonIndex: any) => {
              if (buttonIndex === 0) {
                try {
                  let userPIN: string | undefined;
                  const hasBiometricsEnabled = await keychain.getSupportedBiometryType();
                  if (IS_ANDROID && !hasBiometricsEnabled) {
                    try {
                      userPIN = (await authenticateWithPIN()) ?? undefined;
                    } catch (e) {
                      Alert.alert(i18n.t(i18n.l.back_up.wrong_pin));
                      return;
                    }
                  }

                  // Prompt for authentication before allowing them to delete backups
                  await keychain.getAllKeys();

                  if (IS_ANDROID) {
                    logoutFromGoogleDrive();
                    setAccountDetails(undefined);
                  }
                  removeBackupStateFromAllWallets();

                  await deleteAllBackups();
                  Alert.alert(lang.t('back_up.backup_deleted_successfully'));
                } catch (e) {
                  logger.error(new RainbowError(`[useManageCloudBackups]: Error deleting all backups`), {
                    error: (e as Error).message,
                  });

                  Alert.alert(lang.t('back_up.errors.keychain_access'));
                }
              }
            }
          );
        }

        if (_buttonIndex === 1 && IS_ANDROID) {
          logoutFromGoogleDrive();
          setAccountDetails(undefined);
          loginToGoogleDrive();
        }
      }
    );
  }, [dispatch, accountDetails]);

  return { manageCloudBackups };
}
