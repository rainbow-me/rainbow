import { useCallback } from 'react';
import lang from 'i18n-js';
import { useDispatch } from 'react-redux';
import { cloudPlatform } from '../utils/platform';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { deleteAllBackups } from '@/handlers/cloudBackup';
import { clearAllWalletsBackupStatus } from '@/redux/wallets';
import { showActionSheetWithOptions } from '@/utils';

export default function useManageCloudBackups() {
  const dispatch = useDispatch();

  const manageCloudBackups = useCallback(() => {
    const buttons = [`Delete All ${cloudPlatform} Backups`, 'Cancel'];

    showActionSheetWithOptions(
      {
        cancelButtonIndex: 1,
        destructiveButtonIndex: 1,
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
      }
    );
  }, [dispatch]);

  return { manageCloudBackups };
}
