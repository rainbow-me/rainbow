import lang from 'i18n-js';
import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useCallback } from 'react';
import Menu from '../Menu';
import MenuContainer from '../MenuContainer';
import MenuItem from '../MenuItem';
import BackupWarningIcon from '@/assets/BackupWarning.png';
import { removeFirstEmojiFromString } from '@/helpers/emojiHandler';
import { useManageCloudBackups, useWallets } from '@/hooks';
import { abbreviations } from '@/utils';
import { addressHashedEmoji } from '@/utils/profileUtils';
import MenuHeader from '../MenuHeader';
import { Box, Stack } from '@/design-system';
import { ContactAvatar } from '@/components/contacts';
import WalletTypes from '@/helpers/walletTypes';

type SettingsBackupViewParams = {
  SettingsBackupView: { imported: string; title: string; walletId: string };
};

const SettingsBackupView = () => {
  const { params } = useRoute<
    RouteProp<SettingsBackupViewParams, 'SettingsBackupView'>
  >();

  const { walletId } = params;

  const { wallets } = useWallets();
  const { manageCloudBackups } = useManageCloudBackups();

  const wallet = wallets?.[walletId];

  const onCreateNewWallet = useCallback(() => {}, []);

  return (
    <MenuContainer>
      {!wallet?.backedUp && (
        <>
          <Menu>
            <MenuHeader
              iconComponent={
                <MenuHeader.ImageIcon source={BackupWarningIcon} size={72} />
              }
              titleComponent={
                <MenuHeader.Title
                  text={lang.t('wallet.back_ups.not_backed_up')}
                  weight="heavy"
                />
              }
              labelComponent={
                <Box marginTop={{ custom: 16 }}>
                  <MenuHeader.Label
                    text={lang.t('wallet.back_ups.not_backed_up_message', {
                      backupType: 'Secret Phrase',
                    })}
                  />
                </Box>
              }
            />
          </Menu>

          <Menu>
            <MenuItem
              hasSfSymbol
              leftComponent={<MenuItem.TextIcon icon="􀊯" isLink />}
              onPress={manageCloudBackups}
              size={52}
              titleComponent={
                <MenuItem.Title
                  isLink
                  text={lang.t('back_up.cloud.enable_cloud_backups')}
                />
              }
            />
            <MenuItem
              hasSfSymbol
              leftComponent={<MenuItem.TextIcon icon="􀈊" isLink />}
              onPress={manageCloudBackups}
              size={52}
              titleComponent={
                <MenuItem.Title
                  isLink
                  text={lang.t('back_up.manual.backup_manually')}
                />
              }
            />
          </Menu>
        </>
      )}

      <Stack space={'24px'}>
        {wallet?.addresses
          .filter(a => a.visible)
          .map(({ address, label, image, color, avatar }) => (
            <Menu key={`wallet-${address}`}>
              <MenuItem
                size={60}
                disabled
                leftComponent={
                  <ContactAvatar
                    address={address}
                    avatar={avatar}
                    color={color}
                    image={image}
                    size="small"
                    value={addressHashedEmoji(address)}
                  />
                }
                labelComponent={
                  label.endsWith('.eth') ? (
                    <MenuItem.Label
                      text={abbreviations.address(address, 3, 5) || ''}
                    />
                  ) : null
                }
                titleComponent={
                  <MenuItem.Title
                    text={
                      label.endsWith('.eth')
                        ? removeFirstEmojiFromString(label)
                        : abbreviations.address(address, 3, 5) || ''
                    }
                    weight="semibold"
                  />
                }
                rightComponent={<MenuItem.TextIcon icon="􀍡" />}
              />
            </Menu>
          ))}

        {wallet?.type !== WalletTypes.privateKey && (
          <Menu
            description={lang.t(
              'wallet.back_ups.create_new_wallet_description'
            )}
          >
            <MenuItem
              hasSfSymbol
              leftComponent={<MenuItem.TextIcon icon="􀁍" isLink />}
              onPress={onCreateNewWallet}
              size={52}
              titleComponent={
                <MenuItem.Title
                  isLink
                  text={lang.t('wallet.back_ups.create_new_wallet')}
                />
              }
            />
          </Menu>
        )}
      </Stack>
    </MenuContainer>
  );
};

export default SettingsBackupView;
