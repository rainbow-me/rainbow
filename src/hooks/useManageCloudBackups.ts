import { Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import { cloudPlatform } from '../utils/platform';
import useWallets from './useWallets';
import {
  deleteAllBackups,
  fetchAllBackups,
  fetchUserDataFromCloud,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/cloudBack... Remove this comment to see the full error message
} from '@rainbow-me/handlers/cloudBackup';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/walletBack... Remove this comment to see the full error message
import walletBackupStepTypes from '@rainbow-me/helpers/walletBackupStepTypes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation/Navigat... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation/Navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/wallets' or ... Remove this comment to see the full error message
import { walletsUpdate } from '@rainbow-me/redux/wallets';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { showActionSheetWithOptions } from '@rainbow-me/utils';

export default function useManageCloudBackups() {
  const dispatch = useDispatch();
  const { wallets } = useWallets();
  const { navigate } = useNavigation();

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useCallback'.
  const manageCloudBackups = useCallback(() => {
    const buttons = [
      `Restore from ${cloudPlatform} Backups`,
      `Delete All ${cloudPlatform} Backups`,
      'Cancel',
    ];

    showActionSheetWithOptions(
      {
        cancelButtonIndex: 2,
        destructiveButtonIndex: 1,
        options: buttons,
        title: `Manage ${cloudPlatform} Backups`,
      },
      async (buttonIndex: any) => {
        if (buttonIndex === 0) {
          const { files } = await fetchAllBackups();
          const filteredFiles = files.filter(
            (file: any) => file.name.indexOf('backup_') !== -1
          );
          const backupFiles = filteredFiles.map((file: any, i: any) => {
            const ts = Number(
              file.name
                .replace('.backup_', '')
                .replace('backup_', '')
                .replace('.json', '')
                .replace('.icloud', '')
            );
            const date = new Date(ts);
            const name = `Backup ${i + 1} - ${date.toLocaleDateString()}`;
            return name;
          });

          if (filteredFiles.length > 1) {
            // Choose backup
            showActionSheetWithOptions(
              {
                cancelButtonIndex: backupFiles.length,
                message: `Choose your ${cloudPlatform} backups`,
                options: backupFiles.concat(['Cancel']),
              },
              async (buttonIndex: any) => {
                showActionSheetWithOptions(
                  {
                    cancelButtonIndex: 1,
                    destructiveButtonIndex: 0,
                    message: `This will override all your current wallets. Are you sure?`,
                    options: [`Yes, Restore my backup`, 'Cancel'],
                  },
                  async (actionIndex: any) => {
                    if (actionIndex === 0) {
                      const potentialUserData = await fetchUserDataFromCloud();
                      let backupSelected = null;
                      let userData = null;
                      // If the backup is the latest, we use the normal restore flow
                      // To preserve account names, colors, etc
                      const isUserdataAvailableForThisBackup =
                        potentialUserData
                          .toString()
                          .indexOf(filteredFiles[buttonIndex].name) !== -1;
                      if (isUserdataAvailableForThisBackup) {
                        userData = potentialUserData;
                      } else {
                        backupSelected = filteredFiles[buttonIndex];
                      }

                      navigate(Routes.RESTORE_SHEET, {
                        backupSelected,
                        fromSettings: true,
                        step: walletBackupStepTypes.cloud,
                        userData,
                      });
                    }
                  }
                );
              }
            );
          } else {
            const userData = await fetchUserDataFromCloud();
            navigate(Routes.RESTORE_SHEET, {
              fromSettings: true,
              step: walletBackupStepTypes.cloud,
              userData: userData,
            });
          }
        } else if (buttonIndex === 1) {
          // Delete wallet with confirmation
          showActionSheetWithOptions(
            {
              cancelButtonIndex: 1,
              destructiveButtonIndex: 0,
              message: `Are you sure you want to delete your ${cloudPlatform} wallet backups?`,
              options: [`Confirm and Delete Backups`, 'Cancel'],
            },
            async (buttonIndex: any) => {
              if (buttonIndex === 0) {
                const newWallets = { ...wallets };
                Object.keys(newWallets).forEach(key => {
                  newWallets[key].backedUp = undefined;
                  newWallets[key].backupDate = undefined;
                  newWallets[key].backupFile = undefined;
                  newWallets[key].backupType = undefined;
                });

                await dispatch(walletsUpdate(newWallets));

                // Delete all backups (debugging)
                await deleteAllBackups();

                Alert.alert('Backups Deleted Succesfully');
              }
            }
          );
        }
      }
    );
  }, [dispatch, navigate, wallets]);

  return { manageCloudBackups };
}
