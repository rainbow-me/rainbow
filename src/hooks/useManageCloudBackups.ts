import { useCallback } from 'react';
import lang from 'i18n-js';
import { useDispatch } from 'react-redux';
import { cloudPlatform } from '../utils/platform';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { deleteAllBackups, fetchUserDataFromCloud, logoutFromGoogleDrive } from '@/handlers/cloudBackup';
import { clearAllWalletsBackupStatus } from '@/redux/wallets';
import { showActionSheetWithOptions } from '@/utils';
import { IS_ANDROID } from '@/env';
import { RainbowError, logger } from '@/logger';

export default function useManageCloudBackups() {
  const dispatch = useDispatch();

  const manageCloudBackups = useCallback(() => {
    const buttons = [`Delete All ${cloudPlatform} Backups`, IS_ANDROID ? 'Change Google Drive Account' : undefined, 'Cancel'].filter(
      Boolean
    );

    showActionSheetWithOptions(
      {
        cancelButtonIndex: IS_ANDROID ? 2 : 1,
        destructiveButtonIndex: IS_ANDROID ? 0 : 1,
        options: buttons,
        title: `Manage ${cloudPlatform} Backups`,
      },
      async (_buttonIndex: number) => {
        if (_buttonIndex === 0) {
          showActionSheetWithOptions(
            {
              cancelButtonIndex: 1,
              destructiveButtonIndex: 0,
              message: `Are you sure you want to delete your ${cloudPlatform} wallet backups?`,
              options: [`Confirm and Delete Backups`, 'Cancel'],
            },
            async (buttonIndex: any) => {
              if (buttonIndex === 0) {
                await dispatch(clearAllWalletsBackupStatus());
                // Delete all backups (debugging)
                await deleteAllBackups();

                Alert.alert(lang.t('back_up.backup_deleted_successfully'));
              }
            }
          );
        }

        if (_buttonIndex === 1 && IS_ANDROID) {
          await logoutFromGoogleDrive();
          await dispatch(clearAllWalletsBackupStatus());

          try {
            await fetchUserDataFromCloud();
            logger.info(`Downloaded ${cloudPlatform} backup info`);
          } catch (e) {
            logger.error(new RainbowError('Error fetching user data from cloud'), {
              extra: { error: e },
            });
          }
        }
      }
    );
  }, [dispatch]);

  return { manageCloudBackups };
}
