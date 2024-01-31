import { RouteProp, useRoute } from '@react-navigation/native';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import Clipboard from '@react-native-community/clipboard';

import * as i18n from '@/languages';
import React, { useCallback } from 'react';
import Menu from '../Menu';
import MenuContainer from '../MenuContainer';
import MenuItem from '../MenuItem';
import BackupWarningIcon from '@/assets/BackupWarning.png';
import ManuallyBackedUpIcon from '@/assets/manuallyBackedUp.png';
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
import { useNavigation } from '@/navigation/Navigation';
import walletBackupStepTypes from '@/helpers/walletBackupStepTypes';

type ViewCloudBackupsParams = {
  ViewCloudBackups: { walletId: string };
};

const ViewCloudBackups = () => {
  const { params } = useRoute<
    RouteProp<ViewCloudBackupsParams, 'ViewCloudBackups'>
  >();

  const { walletId } = params;
  const { wallets } = useWallets();
  const wallet = wallets?.[walletId];

  const { navigate } = useNavigation();

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
                  text={i18n.t(i18n.l.wallet.back_ups.not_backed_up)}
                  weight="heavy"
                />
              }
              labelComponent={
                <Box marginTop={{ custom: 16 }}>
                  <MenuHeader.Label
                    text={i18n.t(i18n.l.wallet.back_ups.not_backed_up_message, {
                      backupType: isSecretPhrase
                        ? 'Secret Phrase'
                        : 'Private Key',
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
              onPress={enableCloudBackups}
              size={52}
              titleComponent={
                <MenuItem.Title
                  isLink
                  text={i18n.t(i18n.l.back_up.cloud.enable_cloud_backups)}
                />
              }
            />
            <MenuItem
              hasSfSymbol
              leftComponent={<MenuItem.TextIcon icon="􀈊" isLink />}
              onPress={onManualBackup}
              size={52}
              titleComponent={
                <MenuItem.Title
                  isLink
                  text={i18n.t(i18n.l.back_up.manual.backup_manually)}
                />
              }
            />
          </Menu>
        </>
      )}

      {wallet?.backedUp && (
        <>
          <Menu>
            <MenuHeader
              paddingTop={{ custom: 8 }}
              paddingBottom={{ custom: 24 }}
              iconComponent={
                <MenuHeader.ImageIcon source={ManuallyBackedUpIcon} size={72} />
              }
              titleComponent={
                <MenuHeader.Title
                  text={i18n.t(i18n.l.wallet.back_ups.backed_up_manually)}
                  weight="heavy"
                />
              }
              labelComponent={
                <Box marginTop={{ custom: 16 }}>
                  <MenuHeader.Label
                    text={i18n.t(i18n.l.wallet.back_ups.backed_up_message, {
                      backupType: isSecretPhrase
                        ? 'Secret Phrase'
                        : 'Private Key',
                    })}
                  />
                </Box>
              }
            />
          </Menu>

          <Menu>
            <MenuItem
              hasSfSymbol
              leftComponent={
                <MenuItem.TextIcon icon={isSecretPhrase ? '􀉆' : '􀟖'} isLink />
              }
              onPress={onNavigateToSecretWarning}
              size={52}
              titleComponent={
                <MenuItem.Title
                  isLink
                  text={
                    isSecretPhrase
                      ? i18n.t(i18n.l.wallet.back_ups.view_secret_phrase)
                      : i18n.t(i18n.l.wallet.back_ups.view_private_key)
                  }
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
            description={i18n.t(
              i18n.l.wallet.back_ups.create_new_wallet_description
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
                  text={i18n.t(i18n.l.wallet.back_ups.create_new_wallet)}
                />
              }
            />
          </Menu>
        )}
      </Stack>
    </MenuContainer>
  );
};

export default ViewCloudBackups;
