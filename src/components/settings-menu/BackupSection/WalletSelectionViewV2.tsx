import lang from 'i18n-js';
import React, { useCallback } from 'react';
import { useTheme } from '../../../theme/ThemeContext';
import { cloudPlatform } from '../../../utils/platform';
import { ButtonPressAnimation } from '../../animations';
import { ContactAvatar } from '../../contacts';
import WalletBackupTypes from '@rainbow-me/helpers/walletBackupTypes';
import WalletTypes from '@rainbow-me/helpers/walletTypes';
import { useManageCloudBackups, useWallets } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import { abbreviations } from '@rainbow-me/utils';
import Menu from '../components/Menu';
import MenuItem from '../components/MenuItem';
import { Box, Text } from '@rainbow-me/design-system';
import MenuContainer from '../components/MenuContainer';

const WalletSelectionViewV2 = () => {
  const { navigate } = useNavigation();
  const { colors } = useTheme();
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
            const visibleAccounts = wallet.addresses.filter(a => a.visible);
            const account = visibleAccounts[0];
            const totalAccounts = visibleAccounts.length;
            const { color, label, index, address } = account;
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
                onPress={() =>
                  onPress(key, label || abbreviations.address(address, 4, 6))
                }
                leftComponent={
                  <ContactAvatar
                    alignSelf="center"
                    color={color}
                    marginRight={10}
                    size="smedium"
                    value={labelOrName || `${index + 1}`}
                  />
                }
                rightComponent={
                  <MenuItem.StatusIcon
                    colors={colors}
                    status={
                      wallet.backupType === WalletBackupTypes.cloud
                        ? 'complete'
                        : wallet.backedUp || wallet.imported
                        ? 'incomplete'
                        : 'warning'
                    }
                  />
                }
                label={
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
                hasRightArrow
                title={labelOrName || abbreviations.address(address, 4, 6)}
                size="large"
              />
            );
          })}
      </Menu>
      {cloudBackedUpWallets > 0 && (
        <Box alignItems="center" width="full">
          <ButtonPressAnimation onPress={manageCloudBackups}>
            <Text color="secondary60" size="16px" weight="semibold">
              {`􀍢 ${lang.t('back_up.cloud.manage_platform_backups', {
                cloudPlatformName: cloudPlatform,
              })}`}
            </Text>
          </ButtonPressAnimation>
        </Box>
      )}
    </MenuContainer>
  );
};

export default WalletSelectionViewV2;
