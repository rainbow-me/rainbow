/* eslint-disable no-nested-ternary */
import React, { useCallback, useMemo } from 'react';
import { cloudPlatform } from '@/utils/platform';
import Menu from '../Menu';
import MenuContainer from '../MenuContainer';
import MenuItem from '../MenuItem';
import CloudBackedUpIcon from '@/assets/BackedUpCloud.png';
import WalletsAndBackupIcon from '@/assets/WalletsAndBackup.png';
import CloudBackupWarningIcon from '@/assets/CloudBackupWarning.png';
import WalletBackupTypes from '@/helpers/walletBackupTypes';
import WalletTypes, { EthereumWalletType } from '@/helpers/walletTypes';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { useENSAvatar, useInitializeWallet, useManageCloudBackups, useWallets } from '@/hooks';
import { useNavigation } from '@/navigation';
import { abbreviations } from '@/utils';
import { addressHashedEmoji } from '@/utils/profileUtils';
import * as i18n from '@/languages';
import MenuHeader from '../MenuHeader';
import { checkWalletsForBackupStatus } from '../../utils';
import { Inline, Text, Box, Stack } from '@/design-system';
import { ContactAvatar } from '@/components/contacts';
import { useTheme } from '@/theme';
import Routes from '@/navigation/routesNames';
import { backupsCard } from '@/components/cards/utils/constants';
import { WalletCountPerType, useVisibleWallets } from '../../useVisibleWallets';
import { SETTINGS_BACKUP_ROUTES } from './routes';
import { RainbowAccount, createWallet } from '@/model/wallet';
import { PROFILES, useExperimentalFlag } from '@/config';
import { useDispatch } from 'react-redux';
import { walletsLoadState } from '@/redux/wallets';
import { RainbowError, logger } from '@/logger';
import { IS_ANDROID, IS_IOS } from '@/env';
import { BackupTypes, useCreateBackup } from '@/components/backup/useCreateBackup';
import { BackUpMenuItem } from './BackUpMenuButton';
import { format } from 'date-fns';
import { removeFirstEmojiFromString } from '@/helpers/emojiHandler';
import { Backup, parseTimestampFromFilename } from '@/model/backup';
import { useCloudBackups } from '@/components/backup/CloudBackupProvider';
import { GoogleDriveUserData, getGoogleAccountUserData, isCloudBackupAvailable, login } from '@/handlers/cloudBackup';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { Linking } from 'react-native';
import { noop } from 'lodash';

type WalletPillProps = {
  account: RainbowAccount;
};

const WalletPill = ({ account }: WalletPillProps) => {
  const label = useMemo(() => removeFirstEmojiFromString(account.label), [account.label]);

  const { data: ENSAvatar } = useENSAvatar(label);
  const { colors, isDarkMode } = useTheme();

  const accountImage = addressHashedEmoji(account.address);

  return (
    <Box
      key={account.address}
      flexDirection="row"
      alignItems="center"
      backgroundColor={colors.alpha(colors.grey, 0.4)}
      borderRadius={23}
      shadowColor={isDarkMode ? colors.shadow : colors.alpha(colors.blueGreyDark, 0.1)}
      elevation={12}
      shadowOpacity={IS_IOS ? 0.4 : 1}
      shadowRadius={6}
      paddingLeft={{ custom: 4 }}
      paddingRight={{ custom: 8 }}
      padding={{ custom: 4 }}
    >
      {ENSAvatar?.imageUrl ? (
        <ImageAvatar image={ENSAvatar.imageUrl} marginRight={4} size="smaller_shadowless" />
      ) : (
        <ContactAvatar alignSelf="center" color={account.color} marginRight={4} size="smaller" value={accountImage} />
      )}
      <Text color={'secondary (Deprecated)'} size="11pt" weight="semibold">
        {label.endsWith('.eth')
          ? abbreviations.abbreviateEnsForDisplay(label, 8, 4) ?? ''
          : abbreviations.address(label !== '' ? label : account.address, 3, 5) ?? ''}
      </Text>
    </Box>
  );
};

const getAccountSectionHeight = (numAccounts: number) => {
  const basePadding = 16;
  const rowHeight = 36;
  const rows = Math.ceil(Math.max(1, numAccounts) / 3);
  const paddingBetween = (rows - 1) * 4;

  return basePadding + rows * rowHeight - paddingBetween;
};

export const WalletsAndBackup = () => {
  const { navigate } = useNavigation();
  const { wallets } = useWallets();
  const profilesEnabled = useExperimentalFlag(PROFILES);
  const { backups } = useCloudBackups();
  const dispatch = useDispatch();

  const initializeWallet = useInitializeWallet();

  const { onSubmit, loading } = useCreateBackup({
    walletId: undefined, // NOTE: This is not used when backing up All wallets
  });

  const { manageCloudBackups } = useManageCloudBackups();

  const walletTypeCount: WalletCountPerType = {
    phrase: 0,
    privateKey: 0,
  };

  const { allBackedUp, backupProvider } = useMemo(() => checkWalletsForBackupStatus(wallets), [wallets]);

  const { visibleWallets, lastBackupDate } = useVisibleWallets({ wallets, walletTypeCount });

  const cloudBackups = backups.files
    .filter(backup => {
      if (IS_ANDROID) {
        return !backup.name.match(/UserData/i);
      }

      return backup.isFile && backup.size > 0 && !backup.name.match(/UserData/i);
    })
    .sort((a, b) => {
      return parseTimestampFromFilename(b.name) - parseTimestampFromFilename(a.name);
    });

  const mostRecentBackup = cloudBackups.reduce(
    (prev, current) => {
      if (!current) {
        return prev;
      }

      if (!prev) {
        return current;
      }

      const prevTimestamp = new Date(prev.lastModified).getTime();
      const currentTimestamp = new Date(current.lastModified).getTime();
      if (currentTimestamp > prevTimestamp) {
        return current;
      }

      return prev;
    },
    undefined as Backup | undefined
  );

  const sortedWallets = useMemo(() => {
    const notBackedUpSecretPhraseWallets = visibleWallets.filter(
      wallet => !wallet.isBackedUp && wallet.type === EthereumWalletType.mnemonic
    );
    const notBackedUpPrivateKeyWallets = visibleWallets.filter(
      wallet => !wallet.isBackedUp && wallet.type === EthereumWalletType.privateKey
    );
    const backedUpSecretPhraseWallets = visibleWallets.filter(wallet => wallet.isBackedUp && wallet.type === EthereumWalletType.mnemonic);
    const backedUpPrivateKeyWallets = visibleWallets.filter(wallet => wallet.isBackedUp && wallet.type === EthereumWalletType.privateKey);

    return [
      ...notBackedUpSecretPhraseWallets,
      ...notBackedUpPrivateKeyWallets,
      ...backedUpSecretPhraseWallets,
      ...backedUpPrivateKeyWallets,
    ];
  }, [visibleWallets]);

  const backupAllNonBackedUpWalletsTocloud = useCallback(async () => {
    if (IS_ANDROID) {
      try {
        await login();

        getGoogleAccountUserData().then((accountDetails: GoogleDriveUserData | undefined) => {
          if (accountDetails) {
            return onSubmit({ type: BackupTypes.All });
          }
          Alert.alert(i18n.t(i18n.l.back_up.errors.no_account_found));
        });
      } catch (e) {
        Alert.alert(i18n.t(i18n.l.back_up.errors.no_account_found));
        logger.error(e as RainbowError);
      }
    } else {
      const isAvailable = await isCloudBackupAvailable();
      if (!isAvailable) {
        Alert.alert(
          i18n.t(i18n.l.modal.back_up.alerts.cloud_not_enabled.label),
          i18n.t(i18n.l.modal.back_up.alerts.cloud_not_enabled.description),
          [
            {
              onPress: () => {
                Linking.openURL('https://support.apple.com/en-us/HT204025');
              },
              text: i18n.t(i18n.l.modal.back_up.alerts.cloud_not_enabled.show_me),
            },
            {
              style: 'cancel',
              text: i18n.t(i18n.l.modal.back_up.alerts.cloud_not_enabled.no_thanks),
            },
          ]
        );
        return;
      }
    }

    onSubmit({ type: BackupTypes.All });
  }, [onSubmit]);

  const onViewCloudBackups = useCallback(async () => {
    navigate(SETTINGS_BACKUP_ROUTES.VIEW_CLOUD_BACKUPS, {
      backups,
      title: 'My Cloud Backups',
    });
  }, [backups, navigate]);

  const onCreateNewSecretPhrase = useCallback(async () => {
    navigate(Routes.MODAL_SCREEN, {
      type: 'new_wallet_group',
      numWalletGroups: walletTypeCount.phrase + 1,
      onCloseModal: async ({ name }: { name: string }) => {
        const nameValue = name.trim() !== '' ? name.trim() : '';
        try {
          await createWallet({
            color: null,
            name: nameValue,
            clearCallbackOnStartCreation: true,
          });

          await dispatch(walletsLoadState(profilesEnabled));

          // @ts-expect-error - no params
          await initializeWallet();
        } catch (err) {
          logger.error(new RainbowError('Failed to create new secret phrase'), {
            extra: {
              error: err,
            },
          });
        }
      },
    });
  }, [dispatch, initializeWallet, navigate, profilesEnabled, walletTypeCount.phrase]);

  const onPressLearnMoreAboutCloudBackups = useCallback(() => {
    navigate(Routes.LEARN_WEB_VIEW_SCREEN, {
      ...backupsCard,
      type: 'square',
    });
  }, [navigate]);

  const onNavigateToWalletView = useCallback(
    (walletId: string, name: string) => {
      const wallet = wallets?.[walletId];

      const title = wallet?.imported && wallet.type === WalletTypes.privateKey ? wallet.addresses[0].label : name;
      navigate(SETTINGS_BACKUP_ROUTES.VIEW_WALLET_BACKUP, {
        imported: wallet?.imported,
        title,
        walletId,
      });
    },
    [navigate, wallets]
  );

  const renderView = useCallback(() => {
    switch (backupProvider) {
      default:
      case undefined: {
        return (
          <Stack space={'24px'}>
            <Menu>
              <MenuHeader
                paddingBottom={{ custom: 24 }}
                paddingTop={{ custom: 8 }}
                iconComponent={<MenuHeader.ImageIcon source={WalletsAndBackupIcon} size={72} />}
                titleComponent={<MenuHeader.Title text={i18n.t(i18n.l.wallet.back_ups.cloud_backup_title)} weight="heavy" />}
                statusComponent={<MenuHeader.StatusIcon status="not-enabled" text="Not Enabled" />}
                labelComponent={
                  <MenuHeader.Label
                    text={i18n.t(i18n.l.wallet.back_ups.cloud_backup_description, {
                      link: i18n.t(i18n.l.wallet.back_ups.cloud_backup_link),
                      cloudPlatform,
                    })}
                    linkText={i18n.t(i18n.l.wallet.back_ups.cloud_backup_link)}
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

            <Menu description={i18n.t(i18n.l.back_up.cloud.enable_cloud_backups_description)}>
              <BackUpMenuItem
                title={i18n.t(i18n.l.back_up.cloud.enable_cloud_backups)}
                loading={loading}
                onPress={backupAllNonBackedUpWalletsTocloud}
              />
            </Menu>

            <Stack space={'24px'}>
              {sortedWallets.map(({ name, isBackedUp, accounts, key, numAccounts, backedUp, imported }) => {
                return (
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
                            <Text color={'secondary60 (Deprecated)'} size="14px / 19px (Deprecated)" weight="medium">
                              •
                            </Text>
                          }
                        >
                          {!backedUp && <MenuItem.Label color={'#FF584D'} text={i18n.t(i18n.l.back_up.needs_backup.not_backed_up)} />}
                          {imported && <MenuItem.Label text={i18n.t(i18n.l.wallet.back_ups.imported)} />}
                          <MenuItem.Label
                            text={
                              numAccounts > 1
                                ? i18n.t(i18n.l.wallet.back_ups.wallet_count_gt_one, {
                                    numAccounts,
                                  })
                                : i18n.t(i18n.l.wallet.back_ups.wallet_count, {
                                    numAccounts,
                                  })
                            }
                          />
                        </Inline>
                      }
                      leftComponent={<MenuItem.TextIcon colorOverride={!isBackedUp ? '#FF584D' : ''} icon={isBackedUp ? '􀢶' : '􀡝'} />}
                      onPress={() => onNavigateToWalletView(key, name)}
                      size={60}
                      titleComponent={<MenuItem.Title text={name} />}
                    />
                    <MenuItem
                      key={key}
                      size={getAccountSectionHeight(numAccounts)}
                      disabled
                      titleComponent={
                        <Inline wrap verticalSpace="4px" horizontalSpace="4px">
                          {accounts.map(account => (
                            <WalletPill key={account.address} account={account} />
                          ))}
                        </Inline>
                      }
                    />
                  </Menu>
                );
              })}
              <Menu>
                <MenuItem
                  hasSfSymbol
                  leftComponent={<MenuItem.TextIcon icon="􀁍" isLink />}
                  onPress={onCreateNewSecretPhrase}
                  size={52}
                  titleComponent={<MenuItem.Title isLink text={i18n.t(i18n.l.back_up.manual.create_new_secret_phrase)} />}
                />
              </Menu>

              <Menu>
                <MenuItem
                  hasSfSymbol
                  leftComponent={<MenuItem.TextIcon icon="􀣔" isLink />}
                  onPress={onViewCloudBackups}
                  size={52}
                  titleComponent={
                    <MenuItem.Title
                      isLink
                      text={i18n.t(i18n.l.back_up.cloud.manage_platform_backups, {
                        cloudPlatformName: cloudPlatform,
                      })}
                    />
                  }
                />
                <MenuItem
                  hasSfSymbol
                  leftComponent={<MenuItem.TextIcon icon="􀍡" isLink />}
                  onPress={manageCloudBackups}
                  size={52}
                  titleComponent={
                    <MenuItem.Title
                      isLink
                      text={i18n.t(i18n.l.back_up.cloud.cloud_platform_backup_settings, {
                        cloudPlatformName: cloudPlatform,
                      })}
                    />
                  }
                />
              </Menu>
            </Stack>
          </Stack>
        );
      }

      case WalletBackupTypes.cloud: {
        return (
          <>
            <Stack space={'24px'}>
              <Menu>
                <MenuHeader
                  paddingBottom={{ custom: 24 }}
                  paddingTop={{ custom: 8 }}
                  iconComponent={<MenuHeader.ImageIcon source={allBackedUp ? CloudBackedUpIcon : CloudBackupWarningIcon} size={72} />}
                  titleComponent={<MenuHeader.Title text={i18n.t(i18n.l.wallet.back_ups.cloud_backup_title)} weight="heavy" />}
                  statusComponent={
                    <MenuHeader.StatusIcon
                      status={allBackedUp ? 'up-to-date' : 'out-of-date'}
                      text={allBackedUp ? 'Up to date' : 'Out of date'} // TODO: i18n this
                    />
                  }
                  labelComponent={
                    allBackedUp ? (
                      <MenuHeader.Label
                        linkText={i18n.t(i18n.l.wallet.back_ups.cloud_backup_link)}
                        onPress={() =>
                          navigate(Routes.LEARN_WEB_VIEW_SCREEN, {
                            ...backupsCard,
                            type: 'square',
                          })
                        }
                        text={
                          allBackedUp
                            ? i18n.t(i18n.l.wallet.back_ups.backed_up_to_cloud_message, {
                                cloudPlatform,
                              })
                            : i18n.t(i18n.l.wallet.back_ups.cloud_backup_description, {
                                cloudPlatform,
                              })
                        }
                      />
                    ) : (
                      <MenuHeader.Label
                        text={i18n.t(i18n.l.wallet.back_ups.cloud_backup_out_of_date_description, {
                          cloudPlatform,
                        })}
                      />
                    )
                  }
                />
              </Menu>

              <Menu
                description={
                  mostRecentBackup
                    ? i18n.t(i18n.l.back_up.cloud.latest_backup, {
                        date: format(new Date(mostRecentBackup.lastModified), "M/d/yy 'at' h:mm a"),
                      })
                    : lastBackupDate
                      ? i18n.t(i18n.l.back_up.cloud.latest_backup, {
                          date: format(lastBackupDate, "M/d/yy 'at' h:mm a"),
                        })
                      : undefined
                }
              >
                <BackUpMenuItem
                  title={i18n.t(i18n.l.back_up.cloud.backup_to_cloud_now, {
                    cloudPlatformName: cloudPlatform,
                  })}
                  icon="􀎽"
                  loading={loading}
                  onPress={backupAllNonBackedUpWalletsTocloud}
                />
              </Menu>
            </Stack>

            <Stack space={'24px'}>
              {sortedWallets.map(({ name, isBackedUp, accounts, key, numAccounts, backedUp, imported }) => {
                return (
                  <Menu key={`wallet-${key}`}>
                    <MenuItem
                      hasRightArrow
                      key={key}
                      hasSfSymbol
                      width="full"
                      labelComponent={
                        <Inline
                          space="4px"
                          wrap={false}
                          separator={
                            <Text color={'secondary60 (Deprecated)'} size="14px / 19px (Deprecated)" weight="medium">
                              •
                            </Text>
                          }
                        >
                          {!backedUp && <MenuItem.Label color={'#FF584D'} text={i18n.t(i18n.l.back_up.needs_backup.not_backed_up)} />}
                          {imported && <MenuItem.Label text={i18n.t(i18n.l.wallet.back_ups.imported)} />}
                          <MenuItem.Label
                            text={
                              numAccounts > 1
                                ? i18n.t(i18n.l.wallet.back_ups.wallet_count_gt_one, {
                                    numAccounts,
                                  })
                                : i18n.t(i18n.l.wallet.back_ups.wallet_count, {
                                    numAccounts,
                                  })
                            }
                          />
                        </Inline>
                      }
                      leftComponent={<MenuItem.TextIcon colorOverride={!isBackedUp ? '#FF584D' : ''} icon={isBackedUp ? '􀢶' : '􀡝'} />}
                      onPress={() => onNavigateToWalletView(key, name)}
                      size={60}
                      titleComponent={<MenuItem.Title text={name} />}
                    />
                    <MenuItem
                      key={key}
                      size={getAccountSectionHeight(numAccounts)}
                      disabled
                      width="full"
                      titleComponent={
                        <Inline wrap verticalSpace="4px" horizontalSpace="4px">
                          {accounts.map(account => (
                            <WalletPill key={account.address} account={account} />
                          ))}
                        </Inline>
                      }
                    />
                  </Menu>
                );
              })}

              <Menu>
                <MenuItem
                  hasSfSymbol
                  leftComponent={<MenuItem.TextIcon icon="􀁍" isLink />}
                  onPress={onCreateNewSecretPhrase}
                  size={52}
                  titleComponent={<MenuItem.Title isLink text={i18n.t(i18n.l.back_up.manual.create_new_secret_phrase)} />}
                />
              </Menu>

              <Menu>
                <MenuItem
                  hasSfSymbol
                  leftComponent={<MenuItem.TextIcon icon="􀣔" isLink />}
                  onPress={onViewCloudBackups}
                  size={52}
                  titleComponent={
                    <MenuItem.Title
                      isLink
                      text={i18n.t(i18n.l.back_up.cloud.manage_platform_backups, {
                        cloudPlatformName: cloudPlatform,
                      })}
                    />
                  }
                />
                <MenuItem
                  hasSfSymbol
                  leftComponent={<MenuItem.TextIcon icon="􀍡" isLink />}
                  onPress={manageCloudBackups}
                  size={52}
                  titleComponent={
                    <MenuItem.Title
                      isLink
                      text={i18n.t(i18n.l.back_up.cloud.cloud_platform_backup_settings, {
                        cloudPlatformName: cloudPlatform,
                      })}
                    />
                  }
                />
              </Menu>
            </Stack>
          </>
        );
      }

      case WalletBackupTypes.manual: {
        return (
          <Stack space={'24px'}>
            {sortedWallets.map(({ name, isBackedUp, accounts, key, numAccounts, backedUp, imported }) => {
              return (
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
                          <Text color={'secondary60 (Deprecated)'} size="14px / 19px (Deprecated)" weight="medium">
                            •
                          </Text>
                        }
                      >
                        {!backedUp && <MenuItem.Label color={'#FF584D'} text={i18n.t(i18n.l.back_up.needs_backup.not_backed_up)} />}
                        {imported && <MenuItem.Label text={i18n.t(i18n.l.wallet.back_ups.imported)} />}
                        <MenuItem.Label
                          text={
                            numAccounts > 1
                              ? i18n.t(i18n.l.wallet.back_ups.wallet_count_gt_one, {
                                  numAccounts,
                                })
                              : i18n.t(i18n.l.wallet.back_ups.wallet_count, {
                                  numAccounts,
                                })
                          }
                        />
                      </Inline>
                    }
                    leftComponent={<MenuItem.TextIcon colorOverride={!isBackedUp ? '#FF584D' : ''} icon={isBackedUp ? '􀢶' : '􀡝'} />}
                    onPress={() => onNavigateToWalletView(key, name)}
                    size={60}
                    titleComponent={<MenuItem.Title text={name} />}
                  />
                  <MenuItem
                    key={key}
                    size={getAccountSectionHeight(numAccounts)}
                    disabled
                    titleComponent={
                      <Inline verticalSpace="4px" horizontalSpace="4px">
                        {accounts.map(account => (
                          <WalletPill key={account.address} account={account} />
                        ))}
                      </Inline>
                    }
                  />
                </Menu>
              );
            })}

            <Stack space="36px">
              <Menu>
                <MenuItem
                  hasSfSymbol
                  leftComponent={<MenuItem.TextIcon icon="􀁍" isLink />}
                  onPress={onCreateNewSecretPhrase}
                  size={52}
                  titleComponent={<MenuItem.Title isLink text={i18n.t(i18n.l.back_up.manual.create_new_secret_phrase)} />}
                />
              </Menu>

              <Menu
                description={
                  <Text color="secondary60 (Deprecated)" size="14px / 19px (Deprecated)" weight="regular">
                    {i18n.t(i18n.l.wallet.back_ups.cloud_backup_description, {
                      cloudPlatform,
                    })}

                    <Text onPress={onPressLearnMoreAboutCloudBackups} color="blue" size="14px / 19px (Deprecated)" weight="medium">
                      {' '}
                      {i18n.t(i18n.l.wallet.back_ups.cloud_backup_link)}
                    </Text>
                  </Text>
                }
              >
                <BackUpMenuItem
                  title={i18n.t(i18n.l.back_up.cloud.enable_cloud_backups)}
                  loading={loading}
                  onPress={backupAllNonBackedUpWalletsTocloud}
                />
              </Menu>
            </Stack>
          </Stack>
        );
      }
    }
  }, [
    backupProvider,
    loading,
    backupAllNonBackedUpWalletsTocloud,
    sortedWallets,
    onCreateNewSecretPhrase,
    onViewCloudBackups,
    manageCloudBackups,
    navigate,
    onNavigateToWalletView,
    allBackedUp,
    mostRecentBackup,
    lastBackupDate,
    onPressLearnMoreAboutCloudBackups,
  ]);

  return <MenuContainer>{renderView()}</MenuContainer>;
};

export default WalletsAndBackup;
