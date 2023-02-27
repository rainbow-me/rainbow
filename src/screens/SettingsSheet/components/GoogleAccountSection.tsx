import React, { useEffect, useState } from 'react';
import { IS_ANDROID } from '@/env';
import Menu from '@/components/settings-menu/components/Menu';
import MenuItem from '@/components/settings-menu/components/MenuItem';
import {
  getGoogleAccountUserData,
  GoogleDriveUserData,
  logoutFromGoogleDrive,
} from '@/handlers/cloudBackup';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { showActionSheetWithOptions } from '@/utils';
import * as i18n from '@/languages';
import { useWallets } from '@/hooks';
import {
  clearWalletBackupStateFromAllWallets,
  updateWalletBackupStatuses,
  walletsUpdate,
} from '@/redux/wallets';
import { useDispatch } from 'react-redux';

export const GoogleAccountSection: React.FC = () => {
  const dispatch = useDispatch();
  const [accountDetails, setAccountDetails] = useState<
    GoogleDriveUserData | undefined
  >(undefined);
  const [loading, setLoading] = useState(true);
  const { wallets } = useWallets();

  useEffect(() => {
    getGoogleAccountUserData()
      .then(accountDetails => {
        setAccountDetails(accountDetails ?? undefined);
      })
      .catch(e => {
        console.log('Error while getting google account data', e);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [setAccountDetails]);

  const removeBackupStateFromAllWallets = async () => {
    setLoading(true);
    await dispatch(clearWalletBackupStateFromAllWallets());
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
    await dispatch(updateWalletBackupStatuses());
    try {
      const accountDetails = await getGoogleAccountUserData();
      setAccountDetails(accountDetails ?? undefined);
    } catch (e) {
      // don't have to handle an error case
    } finally {
      setLoading(false);
    }
  };

  if (IS_ANDROID) {
    return (
      <Menu header="Google account used for backups">
        {loading && !accountDetails && (
          <MenuItem
            hasSfSymbol
            size={52}
            leftComponent={<MenuItem.TextIcon icon="􀉭" isLink />}
            titleComponent={<MenuItem.Title text={'Loading...'} isLink />}
          />
        )}
        {!loading && accountDetails && (
          <MenuItem
            size={60}
            leftComponent={
              accountDetails.avatarUrl ? (
                <ImageAvatar image={accountDetails.avatarUrl} size="smedium" />
              ) : undefined
            }
            titleComponent={
              <MenuItem.Title
                text={
                  accountDetails.name ??
                  accountDetails.email ??
                  'Google Account'
                }
              />
            }
            labelComponent={
              accountDetails.name &&
              accountDetails.email && (
                <MenuItem.Label text={accountDetails.email ?? ''} />
              )
            }
            rightComponent={<MenuItem.TextIcon icon="􀍡" isLink />}
            onPress={onGoogleAccountPress}
          />
        )}
        {!loading && !accountDetails && (
          <MenuItem
            hasSfSymbol
            size={52}
            titleComponent={<MenuItem.Title text="Sign in" isLink />}
            leftComponent={<MenuItem.TextIcon icon="􀉭" isLink />}
            onPress={loginToGoogleDrive}
          />
        )}
      </Menu>
    );
  } else {
    return null;
  }
};
