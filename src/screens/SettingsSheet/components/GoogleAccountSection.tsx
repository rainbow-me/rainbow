import React, { useEffect, useState } from 'react';
import { getGoogleAccountUserData, GoogleDriveUserData, logoutFromGoogleDrive } from '@/handlers/cloudBackup';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { showActionSheetWithOptions } from '@/utils';
import * as i18n from '@/languages';
import { clearAllWalletsBackupStatus, updateWalletBackupStatusesBasedOnCloudUserData } from '@/redux/wallets';
import { useDispatch } from 'react-redux';
import Menu from './Menu';
import MenuItem from './MenuItem';
import { logger, RainbowError } from '@/logger';

export const GoogleAccountSection: React.FC = () => {
  const dispatch = useDispatch();
  const [accountDetails, setAccountDetails] = useState<GoogleDriveUserData | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGoogleAccountUserData()
      .then(accountDetails => {
        setAccountDetails(accountDetails ?? undefined);
      })
      .catch(error => {
        logger.error(new RainbowError(`Fetching google account data to display in Backups Section failed`), {
          error: (error as Error).message,
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const removeBackupStateFromAllWallets = async () => {
    setLoading(true);
    await dispatch(clearAllWalletsBackupStatus());
    setLoading(false);
  };

  const onGoogleAccountPress = () => {
    showActionSheetWithOptions(
      {
        cancelButtonIndex: 2,
        options: [
          i18n.t(i18n.l.settings.backup_switch_google_account),
          i18n.t(i18n.l.settings.backup_sign_out),
          i18n.t(i18n.l.button.cancel),
        ],
      },
      (buttonIndex: number) => {
        if (buttonIndex === 0) {
          logoutFromGoogleDrive();
          setAccountDetails(undefined);
          removeBackupStateFromAllWallets().then(() => loginToGoogleDrive());
        } else if (buttonIndex === 1) {
          logoutFromGoogleDrive();
          setAccountDetails(undefined);
          removeBackupStateFromAllWallets();
        }
      }
    );
  };

  const loginToGoogleDrive = async () => {
    setLoading(true);
    await dispatch(updateWalletBackupStatusesBasedOnCloudUserData());
    try {
      const accountDetails = await getGoogleAccountUserData();
      setAccountDetails(accountDetails ?? undefined);
    } catch (error) {
      logger.error(new RainbowError(`Logging into Google Drive failed.`), {
        error: (error as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };
  const onSignInPress = async () => {
    setLoading(true);
    /*
     * Just in case the account state gets broken,
     * we will log out the user when logging in.
     * This should handle any cases where the user didn't have the internet and
     * the Google account data fetching failed.
     */
    await logoutFromGoogleDrive();
    await loginToGoogleDrive();
  };

  return (
    <Menu header={i18n.t(i18n.l.settings.google_account_used)}>
      {loading && (
        <MenuItem
          hasSfSymbol
          size={52}
          leftComponent={<MenuItem.TextIcon icon="􀉭" isLink />}
          titleComponent={<MenuItem.Title text={i18n.t(i18n.l.settings.backup_loading)} isLink />}
        />
      )}
      {!loading && accountDetails && (
        <MenuItem
          size={60}
          leftComponent={accountDetails.avatarUrl ? <ImageAvatar image={accountDetails.avatarUrl} size="smedium" /> : undefined}
          titleComponent={
            <MenuItem.Title text={accountDetails.name ?? accountDetails.email ?? i18n.t(i18n.l.settings.backup_google_account)} />
          }
          labelComponent={accountDetails.name && accountDetails.email && <MenuItem.Label text={accountDetails.email ?? ''} />}
          rightComponent={<MenuItem.TextIcon icon="􀍡" isLink />}
          onPress={onGoogleAccountPress}
        />
      )}
      {!loading && !accountDetails && (
        <MenuItem
          hasSfSymbol
          size={52}
          titleComponent={<MenuItem.Title text={i18n.t(i18n.l.settings.backup_sign_in)} isLink />}
          leftComponent={<MenuItem.TextIcon icon="􀉭" isLink />}
          onPress={onSignInPress}
        />
      )}
    </Menu>
  );
};
