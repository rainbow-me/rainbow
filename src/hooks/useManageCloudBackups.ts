import { IS_ANDROID } from '@/env';
import { maybeAuthenticateWithPIN } from '@/handlers/authentication';
import {
  GoogleDriveUserData,
  deleteAllBackups,
  getGoogleAccountUserData,
  login,
  logoutFromGoogleDrive as logout,
} from '@/handlers/cloudBackup';
import { WrappedAlert as Alert } from '@/helpers/alert';
import * as keychain from '@/keychain';
import i18n from '@/languages';
import { RainbowError, logger } from '@/logger';
import { CloudBackupState, backupsStore } from '@/state/backups/backups';
import { clearAllWalletsBackupStatus } from '@/state/wallets/walletsStore';
import { showActionSheetWithOptions } from '@/utils';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { cloudPlatform } from '../utils/platform';

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
      i18n.settings.delete_backups({ cloudPlatform }),
      IS_ANDROID ? i18n.settings.backup_switch_google_account() : undefined,
      i18n.button.cancel(),
    ].filter(Boolean);

    const getTitleForPlatform = () => {
      if (IS_ANDROID && accountDetails?.email) {
        return i18n.settings.manage_backups({
          cloudPlatformOrEmail: accountDetails.email,
        });
      }
      return i18n.settings.manage_backups({
        cloudPlatformOrEmail: cloudPlatform,
      });
    };

    const removeBackupStateFromAllWallets = () => {
      clearAllWalletsBackupStatus();
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
      async buttonIndex => {
        if (buttonIndex === 0) {
          showActionSheetWithOptions(
            {
              cancelButtonIndex: 1,
              destructiveButtonIndex: 0,
              message: i18n.settings.confirm_delete_backups_description({ cloudPlatform }),
              options: [i18n.settings.confirm_delete_backups(), i18n.button.cancel()],
            },
            async nextButtonIndex => {
              if (nextButtonIndex === 0) {
                try {
                  try {
                    await maybeAuthenticateWithPIN();
                  } catch (e) {
                    Alert.alert(i18n.back_up.wrong_pin());
                    return;
                  }

                  // Prompt for authentication before allowing them to delete backups
                  await keychain.getAllKeys();

                  if (IS_ANDROID) {
                    logoutFromGoogleDrive();
                    setAccountDetails(undefined);
                  }
                  removeBackupStateFromAllWallets();

                  await deleteAllBackups();
                  Alert.alert(i18n.back_up.backup_deleted_successfully());
                } catch (e) {
                  logger.error(new RainbowError(`[useManageCloudBackups]: Error deleting all backups`), {
                    error: (e as Error).message,
                  });

                  Alert.alert(i18n.back_up.errors.keychain_access());
                }
              }
            }
          );
        }

        if (buttonIndex === 1 && IS_ANDROID) {
          logoutFromGoogleDrive();
          setAccountDetails(undefined);
          loginToGoogleDrive();
        }
      }
    );
  }, [dispatch, accountDetails]);

  return { manageCloudBackups };
}
