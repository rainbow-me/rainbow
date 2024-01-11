import lang from 'i18n-js';
import { RouteProp, useRoute } from '@react-navigation/native';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import Clipboard from '@react-native-community/clipboard';

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
import { useRecoilState } from 'recoil';
import { addressCopiedToastAtom } from '@/recoil/addressCopiedToastAtom';
import Routes from '@/navigation/routesNames';
import { navigate } from '@/navigation/Navigation';

type ViewWalletBackupParams = {
  ViewWalletBackup: { walletId: string };
};

const enum WalletMenuAction {
  ViewPrivateKey = 'view_private_key',
  CopyWalletAddress = 'copy_wallet_address',
}

type MenuEvent = {
  nativeEvent: {
    actionKey: WalletMenuAction;
  };
  address: string;
};

const ViewWalletBackup = () => {
  const { params } = useRoute<
    RouteProp<ViewWalletBackupParams, 'ViewWalletBackup'>
  >();

  const { walletId } = params;
  const { wallets } = useWallets();
  const wallet = wallets?.[walletId];

  const { manageCloudBackups } = useManageCloudBackups();

  const [isToastActive, setToastActive] = useRecoilState(
    addressCopiedToastAtom
  );

  const onCreateNewWallet = useCallback(() => {}, []);

  const handleCopyAddress = React.useCallback(
    (address: string) => {
      if (!isToastActive) {
        setToastActive(true);
        setTimeout(() => {
          setToastActive(false);
        }, 2000);
      }
      Clipboard.setString(address);
    },
    [isToastActive, setToastActive]
  );

  const menuConfig = {
    menuTitle: '',
    menuItems: [
      {
        actionKey: WalletMenuAction.ViewPrivateKey,
        actionTitle: lang.t('wallet.back_ups.view_private_key'),
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'key',
        },
      },
      {
        actionKey: WalletMenuAction.CopyWalletAddress,
        actionTitle: lang.t('wallet.back_ups.copy_wallet_address'),
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'square.on.square',
        },
      },
    ],
  };

  const onPressMenuItem = ({
    nativeEvent: { actionKey: menuAction },
    address,
  }: MenuEvent) => {
    switch (menuAction) {
      case WalletMenuAction.ViewPrivateKey:
        navigate(Routes.SETTINGS_WARN_SECRET_VIEW, {
          walletId,
        });
        break;
      case WalletMenuAction.CopyWalletAddress:
        handleCopyAddress(address);
        break;
      default:
        break;
    }
  };

  return (
    <MenuContainer>
      {!wallet?.backedUp && (
        <>
          <Menu>
            <MenuHeader
              paddingTop={{ custom: 8 }}
              paddingBottom={{ custom: 24 }}
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
                rightComponent={
                  <ContextMenuButton
                    menuConfig={menuConfig}
                    onPressMenuItem={(e: MenuEvent) =>
                      onPressMenuItem({ ...e, address })
                    }
                  >
                    <MenuItem.TextIcon icon="􀍡" />
                  </ContextMenuButton>
                }
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

export default ViewWalletBackup;
