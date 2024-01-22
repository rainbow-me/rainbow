import lang from 'i18n-js';
import React, { useCallback, useMemo } from 'react';
import { cloudPlatform } from '@/utils/platform';
import Menu from '../Menu';
import MenuContainer from '../MenuContainer';
import MenuItem from '../MenuItem';
import WalletsAndBackupIcon from '@/assets/walletsAndBackup.png';
import { removeFirstEmojiFromString } from '@/helpers/emojiHandler';
import WalletTypes from '@/helpers/walletTypes';
import { useManageCloudBackups, useWallets } from '@/hooks';
import { useNavigation } from '@/navigation';
import { abbreviations } from '@/utils';
import { addressHashedEmoji } from '@/utils/profileUtils';
import MenuHeader from '../MenuHeader';
import { checkWalletsForBackupStatus } from '../../utils';
import { Inline, Text, Box, Stack } from '@/design-system';
import { ContactAvatar } from '@/components/contacts';
import { useTheme } from '@/theme';
import Routes from '@/navigation/routesNames';
import WalletBackupStepTypes from '@/helpers/walletBackupStepTypes';
import { backupsCard } from '@/components/cards/utils/constants';

const WalletsAndBackup = () => {
  const { colors, isDarkMode } = useTheme();

  const { navigate } = useNavigation();
  const { wallets } = useWallets();
  const { manageCloudBackups } = useManageCloudBackups();

  const enabledCloudBackups = useCallback(() => {
    navigate(Routes.BACKUP_SHEET, {
      nativeScreen: true,
      step: WalletBackupStepTypes.cloud,
    });
  }, [navigate]);

  const onBackupToCloud = useCallback(() => {
    navigate(Routes.BACKUP_SHEET, {
      nativeScreen: true,
      step: WalletBackupStepTypes.cloud,
    });
  }, [navigate]);

  const onCreateNewSecretPhrase = useCallback(() => {}, []);

  const {
    hasManualBackup,
    hasCloudBackup,
    numberOfPrivateKeyWallets,
    numberOfSecretPhraseWallets,
  } = useMemo(() => checkWalletsForBackupStatus(wallets), [wallets]);

  const onNavigateToWalletView = useCallback(
    (walletId: string, name: string) => {
      console.log({ walletId, name });
      const wallet = wallets?.[walletId];

      const title =
        wallet?.imported && wallet.type === WalletTypes.privateKey
          ? wallet.addresses[0].label
          : name;
      navigate(Routes.SETTINGS_BACKUP_VIEW, {
        imported: wallet?.imported,
        title,
        walletId,
      });
    },
    [navigate, wallets]
  );

  let privateKeyWallets = 1;
  let secretPhraseWallets = 1;
  let lastBackupDate: number | undefined;

  const visibleWallets = wallets
    ? Object.keys(wallets)
        .filter(
          key =>
            wallets[key].type !== WalletTypes.readOnly &&
            wallets[key].type !== WalletTypes.bluetooth
        )
        .map(key => {
          const wallet = wallets[key];
          const visibleAccounts = wallet.addresses.filter(a => a.visible);
          const totalAccounts = visibleAccounts.length;

          if (
            wallet.backedUp &&
            wallet.backupDate &&
            (!lastBackupDate || wallet.backupDate > lastBackupDate)
          ) {
            lastBackupDate = wallet.backupDate;
          }

          let name = '';
          if (wallet.type === WalletTypes.privateKey) {
            if (numberOfPrivateKeyWallets > 1) {
              name = `Private Key ${privateKeyWallets}`;
              privateKeyWallets += 1;
            } else {
              name = 'Private Key';
            }
          }

          if (
            wallet.type === WalletTypes.mnemonic ||
            wallet.type === WalletTypes.seed
          ) {
            if (numberOfSecretPhraseWallets > 1) {
              name = `Secret Phrase ${secretPhraseWallets}`;
              secretPhraseWallets += 1;
            } else {
              name = 'Secret Phrase';
            }
          }

          return {
            name,
            isBackedUp: wallet.backedUp,
            accounts: visibleAccounts,
            key,
            label: wallet.name,
            numAccounts: totalAccounts,
            wallet,
          };
        })
    : [];

  return (
    <MenuContainer>
      {!hasManualBackup && (
        <>
          <Menu>
            <MenuHeader
              paddingBottom={{ custom: 24 }}
              paddingTop={{ custom: 8 }}
              iconComponent={
                <MenuHeader.ImageIcon source={WalletsAndBackupIcon} size={72} />
              }
              titleComponent={
                <MenuHeader.Title
                  text={lang.t('wallet.back_ups.cloud_backup_title')}
                  weight="heavy"
                />
              }
              statusComponent={
                <MenuHeader.StatusIcon
                  status="not-enabled"
                  text="Not Enabled"
                />
              }
              labelComponent={
                <MenuHeader.Label
                  text={lang.t('wallet.back_ups.cloud_backup_description', {
                    link: lang.t('wallet.back_ups.cloud_backup_link'),
                  })}
                  linkText={lang.t('wallet.back_ups.cloud_backup_link')}
                  onPress={() =>
                    navigate(Routes.LEARN_WEB_VIEW_SCREEN, {
                      ...backupsCard,
                      type: 'square',
                    })
                  }
                />
              }
            />
          </Menu>
          {!hasCloudBackup && (
            <Menu
              description={lang.t(
                'back_up.cloud.enable_cloud_backups_description'
              )}
            >
              <MenuItem
                hasSfSymbol
                leftComponent={<MenuItem.TextIcon icon="􀊯" isLink />}
                onPress={enabledCloudBackups}
                size={52}
                titleComponent={
                  <MenuItem.Title
                    isLink
                    text={lang.t('back_up.cloud.enable_cloud_backups')}
                  />
                }
              />
            </Menu>
          )}

          {hasCloudBackup && (
            <Menu
              description={lang.t('back_up.cloud.latest_backup', {
                date: lastBackupDate,
              })}
            >
              <MenuItem
                hasSfSymbol
                leftComponent={<MenuItem.TextIcon icon="􀎽" isLink />}
                onPress={onBackupToCloud}
                size={52}
                titleComponent={
                  <MenuItem.Title
                    isLink
                    text={lang.t('back_up.cloud.backup_to_cloud_now', {
                      cloudPlatformName: cloudPlatform,
                    })}
                  />
                }
              />
            </Menu>
          )}
        </>
      )}

      <Stack space={'24px'}>
        {visibleWallets.map(
          ({ name, isBackedUp, accounts, key, numAccounts, wallet }) => (
            <Menu key={`wallet-${key}`}>
              <MenuItem
                hasRightArrow
                key={key}
                hasSfSymbol
                labelComponent={
                  <Inline
                    space="4px"
                    wrap={false}
                    separator={
                      <Text
                        color={'secondary60 (Deprecated)'}
                        size="14px / 19px (Deprecated)"
                        weight="medium"
                      >
                        •
                      </Text>
                    }
                  >
                    {!wallet.backedUp && (
                      <MenuItem.Label
                        color={'#FF584D'}
                        text={lang.t('back_up.needs_backup.not_backed_up')}
                      />
                    )}
                    {wallet.imported && (
                      <MenuItem.Label
                        text={lang.t('wallet.back_ups.imported')}
                      />
                    )}
                    <MenuItem.Label
                      text={
                        numAccounts > 1
                          ? lang.t('wallet.back_ups.wallet_count_gt_one', {
                              numAccounts,
                            })
                          : lang.t('wallet.back_ups.wallet_count', {
                              numAccounts,
                            })
                      }
                    />
                  </Inline>
                }
                leftComponent={
                  <MenuItem.TextIcon
                    colorOverride={!isBackedUp ? '#FF584D' : ''}
                    icon={isBackedUp ? '􀢶' : '􀡝'}
                  />
                }
                onPress={() => onNavigateToWalletView(key, name)}
                size={60}
                titleComponent={<MenuItem.Title text={name ?? ''} />}
              />
              <MenuItem
                key={key}
                size={numAccounts > 1 ? 52 * (numAccounts / 3) : 52}
                disabled
                titleComponent={
                  <Inline wrap verticalSpace="4px" horizontalSpace="4px">
                    {accounts.map(({ address, label, color }) => {
                      return (
                        <Box
                          key={address}
                          flexDirection="row"
                          alignItems="center"
                          backgroundColor={colors.alpha(colors.grey, 0.4)}
                          borderRadius={23}
                          shadowColor={
                            isDarkMode
                              ? colors.shadow
                              : colors.alpha(colors.blueGreyDark, 0.1)
                          }
                          elevation={12}
                          shadowOpacity={ios ? 0.4 : 1}
                          shadowRadius={6}
                          paddingLeft={{ custom: 4 }}
                          paddingRight={{ custom: 8 }}
                          padding={{ custom: 4 }}
                        >
                          <ContactAvatar
                            alignSelf="center"
                            color={color}
                            marginRight={4}
                            size="smaller"
                            value={addressHashedEmoji(address)}
                          />
                          <Text
                            color={'secondary (Deprecated)'}
                            size="11pt"
                            weight="semibold"
                          >
                            {label.endsWith('.eth')
                              ? removeFirstEmojiFromString(label)
                              : abbreviations.address(address, 3, 5) || ''}
                          </Text>
                        </Box>
                      );
                    })}
                  </Inline>
                }
              />
            </Menu>
          )
        )}

        <Menu>
          <MenuItem
            hasSfSymbol
            leftComponent={<MenuItem.TextIcon icon="􀁍" isLink />}
            onPress={onCreateNewSecretPhrase}
            size={52}
            titleComponent={
              <MenuItem.Title
                isLink
                text={lang.t('back_up.manual.create_new_secret_phrase')}
              />
            }
          />
        </Menu>

        {hasManualBackup && (
          <Menu
            description={lang.t('wallet.back_ups.cloud_backup_description')}
          >
            <MenuItem
              hasSfSymbol
              leftComponent={<MenuItem.TextIcon icon="􀊯" isLink />}
              onPress={enabledCloudBackups}
              size={52}
              titleComponent={
                <MenuItem.Title
                  isLink
                  text={lang.t('back_up.cloud.enable_cloud_backups')}
                />
              }
            />
          </Menu>
        )}

        {hasCloudBackup && (
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
      </Stack>
    </MenuContainer>
  );
};

export default WalletsAndBackup;
