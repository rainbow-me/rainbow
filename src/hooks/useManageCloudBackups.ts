import { useCallback, useEffect, useState } from 'react';
import lang from 'i18n-js';
import { useDispatch } from 'react-redux';
import { cloudPlatform } from '../utils/platform';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { GoogleDriveUserData, getGoogleAccountUserData, deleteAllBackups, logoutFromGoogleDrive } from '@/handlers/cloudBackup';
import { clearAllWalletsBackupStatus, updateWalletBackupStatusesBasedOnCloudUserData } from '@/redux/wallets';
import { showActionSheetWithOptions } from '@/utils';
import { IS_ANDROID } from '@/env';
import { RainbowError, logger } from '@/logger';
import * as i18n from '@/languages';

export default function useManageCloudBackups() {
  const dispatch = useDispatch();
  const [accountDetails, setAccountDetails] = useState<GoogleDriveUserData | undefined>(undefined);

  useEffect(() => {
    getGoogleAccountUserData()
      .then(accountDetails => {
        setAccountDetails(accountDetails ?? undefined);
      })
      .catch(error => {
        logger.error(new RainbowError(`Error Fetching google account data for Backups Section`), {
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

    const loginToGoogleDrive = async () => {
      await dispatch(updateWalletBackupStatusesBasedOnCloudUserData());
      try {
        const accountDetails = await getGoogleAccountUserData();
        setAccountDetails(accountDetails ?? undefined);
      } catch (error) {
        logger.error(new RainbowError(`Logging into Google Drive failed.`), {
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
                if (IS_ANDROID) {
                  logoutFromGoogleDrive();
                  setAccountDetails(undefined);
                }
                removeBackupStateFromAllWallets();

                await deleteAllBackups();
                Alert.alert(lang.t('back_up.backup_deleted_successfully'));
              }
            }
          );
        }

        if (_buttonIndex === 1 && IS_ANDROID) {
          logoutFromGoogleDrive();
          setAccountDetails(undefined);
          removeBackupStateFromAllWallets().then(() => loginToGoogleDrive());
        }
      }
    );
  }, [dispatch, accountDetails]);

  return { manageCloudBackups };
}
