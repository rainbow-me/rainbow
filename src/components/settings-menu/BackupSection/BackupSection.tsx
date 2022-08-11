import lang from 'i18n-js';
import React, { useCallback } from 'react';
import { cloudPlatform } from '../../../utils/platform';
import { ContactAvatar } from '../../contacts';
import Menu from '../components/Menu';
import MenuContainer from '../components/MenuContainer';
import MenuItem from '../components/MenuItem';
import { removeFirstEmojiFromString } from '@rainbow-me/helpers/emojiHandler';
import WalletBackupTypes from '@rainbow-me/helpers/walletBackupTypes';
import WalletTypes from '@rainbow-me/helpers/walletTypes';
import { useManageCloudBackups, useWallets } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import { abbreviations } from '@rainbow-me/utils';
import { addressHashedEmoji } from '@rainbow-me/utils/profileUtils';

const BackupSection = () => {
  const { navigate } = useNavigation();
  const { walletNames, wallets } = useWallets();
  const { manageCloudBackups } = useManageCloudBackups();

  const onPress = useCallback(
    (walletId, name) => {
      const wallet = wallets[walletId];
      if (wallet.backedUp || wallet.imported) {
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

  return (
    <MenuContainer>
      <Menu>
        {Object.keys(wallets)
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

            return (
              <MenuItem
                hasRightArrow
                key={key}
                labelComponent={
                  <MenuItem.Label
                    text={
                      totalAccounts > 1
                        ? totalAccounts > 2
                          ? lang.t('wallet.back_ups.and_more_wallets', {
                              moreWalletCount: totalAccounts - 1,
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
                      totalAccounts <= 1 && !wallet.backedUp && !wallet.imported
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
                      abbreviations.address(address, 4, 6)
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
            );
          })}
      </Menu>
      {cloudBackedUpWallets > 0 && (
        <Menu>
          <MenuItem
            isSfSymbol
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
