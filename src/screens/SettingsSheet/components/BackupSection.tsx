import lang from 'i18n-js';
import React, { useCallback } from 'react';
import { cloudPlatform } from '@/utils/platform';
import { ContactAvatar } from '../../../components/contacts';
import Menu from './Menu';
import MenuContainer from './MenuContainer';
import MenuItem from './MenuItem';
import { removeFirstEmojiFromString } from '@/helpers/emojiHandler';
import WalletBackupTypes from '@/helpers/walletBackupTypes';
import WalletTypes from '@/helpers/walletTypes';
import { useManageCloudBackups, useWallets } from '@/hooks';
import { useNavigation } from '@/navigation';
import { abbreviations } from '@/utils';
import { addressHashedEmoji } from '@/utils/profileUtils';

const BackupSection = () => {
  const { navigate } = useNavigation();
  const { walletNames, wallets } = useWallets();
  const { manageCloudBackups } = useManageCloudBackups();

  const onPress = useCallback(
    (walletId: string, name: string) => {
      const wallet = wallets?.[walletId];
      if (wallet?.backedUp || wallet?.imported) {
        navigate('SettingsBackupView', {
          imported: wallet.imported,
          title: name,
          type: 'AlreadyBackedUpView',
          walletId,
        });
      } else {
        navigate('SettingsBackupView', {
          title: name,
          type: 'NeedsBackupView',
          walletId,
        });
      }
    },
    [navigate, wallets]
  );

  let cloudBackedUpWallets = 0;

  const backups = wallets
    ? Object.keys(wallets)
        .filter(key => wallets[key].type !== WalletTypes.readOnly)
        .map(key => {
          const wallet = wallets[key];
          const visibleAccounts = wallet.addresses.filter(
            (a: any) => a.visible
          );
          const account = visibleAccounts[0];
          const totalAccounts = visibleAccounts.length;
          const { color, label, address } = account;
          if (wallet.backupType === WalletBackupTypes.cloud) {
            cloudBackedUpWallets += 1;
          }
          let labelOrName = label;
          if (!label) {
            if (walletNames[address]) {
              labelOrName = walletNames[address];
            }
          }
          return {
            address,
            color,
            key,
            label: labelOrName,
            numAccounts: totalAccounts,
            wallet,
          };
        })
    : [];

  return (
    <MenuContainer>
      <Menu>
        {backups.map(
          ({
            address,
            color,
            key,
            label: labelOrName,
            numAccounts,
            wallet,
          }) => (
            <MenuItem
              hasRightArrow
              key={key}
              labelComponent={
                <MenuItem.Label
                  text={
                    numAccounts > 1
                      ? numAccounts > 2
                        ? lang.t('wallet.back_ups.and_more_wallets', {
                            moreWalletCount: numAccounts - 1,
                          })
                        : lang.t('wallet.back_ups.and_1_more_wallet')
                      : wallet.backedUp
                      ? wallet.backupType === WalletBackupTypes.cloud
                        ? lang.t('wallet.back_ups.backed_up')
                        : lang.t('wallet.back_ups.backed_up_manually')
                      : wallet.imported
                      ? lang.t('wallet.back_ups.imported')
                      : lang.t('back_up.needs_backup.not_backed_up')
                  }
                  warn={
                    numAccounts <= 1 && !wallet.backedUp && !wallet.imported
                  }
                />
              }
              leftComponent={
                <ContactAvatar
                  alignSelf="center"
                  color={color}
                  marginRight={10}
                  size="small"
                  value={addressHashedEmoji(address)}
                />
              }
              onPress={() =>
                onPress(
                  key,
                  removeFirstEmojiFromString(labelOrName) ||
                    abbreviations.address(address, 4, 6) ||
                    ''
                )
              }
              rightComponent={
                <MenuItem.StatusIcon
                  status={
                    wallet.backupType === WalletBackupTypes.cloud
                      ? 'complete'
                      : wallet.backedUp || wallet.imported
                      ? 'incomplete'
                      : 'warning'
                  }
                />
              }
              size={60}
              titleComponent={
                <MenuItem.Title
                  text={
                    removeFirstEmojiFromString(labelOrName) ||
                    abbreviations.address(address, 4, 6) ||
                    ''
                  }
                />
              }
            />
          )
        )}
      </Menu>
      {cloudBackedUpWallets > 0 && (
        <Menu>
          <MenuItem
            hasSfSymbol
            leftComponent={<MenuItem.TextIcon icon="􀡜" isLink />}
            onPress={manageCloudBackups}
            size={52}
            titleComponent={
              <MenuItem.Title
                isLink
                text={lang.t('back_up.cloud.manage_platform_backups', {
                  cloudPlatformName: cloudPlatform,
                })}
              />
            }
          />
        </Menu>
      )}
    </MenuContainer>
  );
};

export default BackupSection;
