import lang from 'i18n-js';
import { useDispatch } from 'react-redux';
import { cloudPlatform } from '../utils/platform';
import useWallets from './useWallets';
import { WrappedAlert as Alert } from '@/helpers/alert';
import match from '@/utils/match';
import { matchError } from '@/utils/matchError';
import {
  deleteAllBackups,
  fetchAllBackups,
  fetchUserDataFromCloud,
} from '@rainbow-me/handlers/cloudBackup';
import walletBackupStepTypes from '@rainbow-me/helpers/walletBackupStepTypes';
import { useNavigation } from '@rainbow-me/navigation/Navigation';
import { walletsUpdate } from '@rainbow-me/redux/wallets';
import Routes from '@rainbow-me/routes';
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
    try {
      showActionSheetWithOptions(
        {
          cancelButtonIndex: 2,
          destructiveButtonIndex: 1,
          options: buttons,
          title: `Manage ${cloudPlatform} Backups`,
        },
        async (buttonIndex: number) => {
          if (buttonIndex === 0) {
            const { files } = await fetchAllBackups();
            const filteredFiles = files.filter(
              (file: any) => file.name.indexOf('backup_') !== -1
            );
            const backupFiles = filteredFiles.map((file: any, i: number) => {
              const ts = Number(
                file.name
                  .replace('.backup_', '')
                  .replace('backup_', '')
                  .replace('.json', '')
                  .replace('.icloud', '')
                  .replace('rainbow.me/wallet-backups/', '')
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
                async (buttonIndex: number) => {
                  showActionSheetWithOptions(
                    {
                      cancelButtonIndex: 1,
                      destructiveButtonIndex: 0,
                      message: `This will override all your current wallets. Are you sure?`,
                      options: [`Yes, Restore my backup`, 'Cancel'],
                    },
                    async (actionIndex: number) => {
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

                  Alert.alert(lang.t('back_up.backup_deleted_successfully'));
                }
              }
            );
          }
        }
      );
    } catch (err: any) {
      const matched = matchError(err);

      const textForAlert = match(
        lang.t('errors.connectWithSupport'),
        [
          matched.CLOUD_BACKUP_NO_BACKUPS_FOUND,
          lang.t('errors.backup.no_backups_found'),
        ],
        [
          matched.CLOUD_BACKUP_SPECIFIC_BACKUP_NOT_FOUND,
          lang.t('errors.backup.specific_backup_no_found'),
        ],
        [
          matched.CLOUD_BACKUP_ERROR_DECRYPTING_DATA,
          lang.t('errors.backup.error_decrypting_data'),
        ],
        [
          matched.CLOUD_BACKUP_ERROR_GETTING_ENCRYPTED_DATA,
          lang.t('errors.backup.error_getting_data'),
        ]
      );
      Alert.alert(textForAlert);
    }
  }, [dispatch, navigate, wallets]);

  return { manageCloudBackups };
}
