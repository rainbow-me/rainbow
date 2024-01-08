import lang from 'i18n-js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { cloudPlatform } from '@/utils/platform';
import Menu from './Menu';
import MenuContainer from './MenuContainer';
import MenuItem from './MenuItem';
import WalletsAndBackupIcon from '@/assets/walletsAndBackup.png';
import { removeFirstEmojiFromString } from '@/helpers/emojiHandler';
import WalletBackupTypes from '@/helpers/walletBackupTypes';
import WalletTypes, { EthereumWalletType } from '@/helpers/walletTypes';
import { useManageCloudBackups, useWallets } from '@/hooks';
import { useNavigation } from '@/navigation';
import { abbreviations } from '@/utils';
import { addressHashedEmoji } from '@/utils/profileUtils';
import MenuHeader from './MenuHeader';
import { checkWalletsForBackupStatus } from '../utils';
import { Inline, Text, Box } from '@/design-system';
import { ContactAvatar } from '@/components/contacts';
import { useTheme } from '@/theme';

const BackupSection = () => {
  const { colors, isDarkMode } = useTheme();
  const [numOfEachWalletType, setNumOfEachWalletType] = useState({
    seedPhrase: 0,
    privateKey: 0,
  });

  const { navigate } = useNavigation();
  const { walletNames, wallets } = useWallets();
  const { manageCloudBackups } = useManageCloudBackups();

  const enabledCloudBackups = useCallback(() => {}, []);

  const onCreateNewSecretPhrase = useCallback(() => {}, []);

  const {
    allBackedUp,
    areBackedUp,
    canBeBackedUp,
    hasManualBackup,
  } = useMemo(() => checkWalletsForBackupStatus(wallets), [wallets]);

  const onNavigateToWalletView = useCallback(
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
  let privateKeyWallets = 1;
  let seedPhraseWallets = 1;

  console.log({ numOfEachWalletType });

  const backups = wallets
    ? Object.keys(wallets)
        .filter(
          key =>
            wallets[key].type !== WalletTypes.readOnly &&
            wallets[key].type !== WalletTypes.bluetooth
        )
        .map(key => {
          const wallet = wallets[key];
          console.log(JSON.stringify(wallet, null, 2));
          const visibleAccounts = wallet.addresses.filter(
            (a: any) => a.visible
          );
          const totalAccounts = visibleAccounts.length;
          if (wallet.backupType === WalletBackupTypes.cloud) {
            cloudBackedUpWallets += 1;
          }

          let name = '';
          if (wallet.type === WalletTypes.privateKey) {
            if (numOfEachWalletType.privateKey > 1) {
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
            if (numOfEachWalletType.seedPhrase > 1) {
              name = `Secret Phrase ${seedPhraseWallets}`;
              seedPhraseWallets += 1;
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

  useEffect(() => {
    if (!wallets) return;

    const seedPhraseWallets = Object.values(wallets).filter(
      w => w.type === WalletTypes.mnemonic || w.type === WalletTypes.seed
    ).length;

    const privateKeyWallets = Object.values(wallets).filter(
      w => w.type === WalletTypes.privateKey
    ).length;

    setNumOfEachWalletType({
      seedPhrase: seedPhraseWallets,
      privateKey: privateKeyWallets,
    });
  }, [wallets]);

  return (
    <>
      {!hasManualBackup && (
        <MenuContainer>
          <Menu>
            <MenuHeader
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
                />
              }
            />
          </Menu>

          <Menu
            description={lang.t(
              'back_up.cloud.enable_cloud_backups_description'
            )}
          >
            <MenuItem
              hasSfSymbol
              leftComponent={<MenuItem.TextIcon icon="􀎽" isLink />}
              onPress={manageCloudBackups}
              size={52}
              titleComponent={
                <MenuItem.Title
                  isLink
                  text={lang.t('back_up.cloud.enable_cloud_backups')}
                />
              }
            />
          </Menu>
        </MenuContainer>
      )}

      <MenuContainer space={'24px'}>
        {backups.map(
          ({ name, isBackedUp, accounts, key, label, numAccounts, wallet }) => (
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
                    {accounts.map(({ address, label, color }: any) => {
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

        <Menu description={lang.t('wallet.back_ups.cloud_backup_description')}>
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

        {!!cloudBackedUpWallets && (
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
    </>
  );
};

export default BackupSection;
