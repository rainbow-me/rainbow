import React, { useCallback, useMemo } from 'react';
import { cloudPlatform } from '@/utils/platform';
import Menu from '../Menu';
import MenuContainer from '../MenuContainer';
import MenuItem from '../MenuItem';
import WalletsAndBackupIcon from '@/assets/walletsAndBackup.png';
import CloudBackupWarningIcon from '@/assets/CloudBackupWarning.png';
import WalletBackupTypes from '@/helpers/walletBackupTypes';
import { removeFirstEmojiFromString } from '@/helpers/emojiHandler';
import WalletTypes from '@/helpers/walletTypes';
import { useManageCloudBackups, useWallets } from '@/hooks';
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
import WalletBackupStepTypes from '@/helpers/walletBackupStepTypes';
import { backupsCard } from '@/components/cards/utils/constants';
import { useVisibleWallets } from '../../useVisibleWallets';
import { format } from 'date-fns';
import useCloudBackups from '@/hooks/useCloudBackups';

export const WalletsAndBackup = () => {
  const { colors, isDarkMode } = useTheme();

  const { navigate } = useNavigation();
  const { wallets } = useWallets();

  const { backups } = useCloudBackups();

  const { manageCloudBackups } = useManageCloudBackups();

  const enabledCloudBackups = useCallback(() => {
    navigate(Routes.BACKUP_SHEET, {
      nativeScreen: true,
      step: WalletBackupStepTypes.cloud,
    });
  }, [navigate]);

  const onViewCloudBackups = useCallback(async () => {
    navigate('ViewCloudBackups', {
      backups,
      title: 'My Cloud Backups',
    });
  }, [backups, navigate]);

  const onCreateNewSecretPhrase = useCallback(() => {}, []);

  const onPressLearnMoreAboutCloudBackups = useCallback(() => {
    navigate(Routes.LEARN_WEB_VIEW_SCREEN, {
      ...backupsCard,
      type: 'square',
    });
  }, [navigate]);

  const onNavigateToWalletView = useCallback(
    (walletId: string, name: string) => {
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

  const { backupProvider, allBackedUp } = useMemo(
    () => checkWalletsForBackupStatus(wallets),
    [wallets]
  );

  const { visibleWallets, lastBackupDate } = useVisibleWallets({ wallets });

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
                iconComponent={
                  <MenuHeader.ImageIcon
                    source={WalletsAndBackupIcon}
                    size={72}
                  />
                }
                titleComponent={
                  <MenuHeader.Title
                    text={i18n.t(i18n.l.wallet.back_ups.cloud_backup_title)}
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
                    text={i18n.t(
                      i18n.l.wallet.back_ups.cloud_backup_description,
                      {
                        link: i18n.t(i18n.l.wallet.back_ups.cloud_backup_link),
                      }
                    )}
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

            <Menu
              description={i18n.t(
                i18n.l.back_up.cloud.enable_cloud_backups_description
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
                    text={i18n.t(i18n.l.back_up.cloud.enable_cloud_backups)}
                  />
                }
              />
            </Menu>

            <Stack space={'24px'}>
              {visibleWallets.map(
                ({
                  name,
                  isBackedUp,
                  accounts,
                  key,
                  numAccounts,
                  backedUp,
                  imported,
                }) => (
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
                          {!backedUp && (
                            <MenuItem.Label
                              color={'#FF584D'}
                              text={i18n.t(
                                i18n.l.back_up.needs_backup.not_backed_up
                              )}
                            />
                          )}
                          {imported && (
                            <MenuItem.Label
                              text={i18n.t(i18n.l.wallet.back_ups.imported)}
                            />
                          )}
                          <MenuItem.Label
                            text={
                              numAccounts > 1
                                ? i18n.t(
                                    i18n.l.wallet.back_ups.wallet_count_gt_one,
                                    {
                                      numAccounts,
                                    }
                                  )
                                : i18n.t(i18n.l.wallet.back_ups.wallet_count, {
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
                      size={numAccounts > 3 ? 52 * (numAccounts / 3) : 52}
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
                                    : abbreviations.address(address, 3, 5) ||
                                      ''}
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
                      text={i18n.t(
                        i18n.l.back_up.manual.create_new_secret_phrase
                      )}
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
                  iconComponent={
                    <MenuHeader.ImageIcon
                      source={
                        allBackedUp
                          ? WalletsAndBackupIcon
                          : CloudBackupWarningIcon
                      }
                      size={72}
                    />
                  }
                  titleComponent={
                    <MenuHeader.Title
                      text={i18n.t(i18n.l.wallet.back_ups.cloud_backup_title)}
                      weight="heavy"
                    />
                  }
                  statusComponent={
                    <MenuHeader.StatusIcon
                      status={allBackedUp ? 'up-to-date' : 'out-of-date'}
                      text={allBackedUp ? 'Up to date' : 'Out of date'} // TODO: i18n this
                    />
                  }
                  labelComponent={
                    allBackedUp ? (
                      <MenuHeader.Label
                        text={i18n.t(
                          i18n.l.wallet.back_ups.cloud_backup_description,
                          {
                            link: i18n.t(
                              i18n.l.wallet.back_ups.cloud_backup_link
                            ),
                          }
                        )}
                        linkText={i18n.t(
                          i18n.l.wallet.back_ups.cloud_backup_link
                        )}
                        onPress={() =>
                          navigate(Routes.LEARN_WEB_VIEW_SCREEN, {
                            ...backupsCard,
                            type: 'square',
                          })
                        }
                      />
                    ) : (
                      <MenuHeader.Label
                        text={i18n.t(
                          i18n.l.wallet.back_ups
                            .cloud_backup_out_of_date_description,
                          {
                            cloudPlatform,
                          }
                        )}
                      />
                    )
                  }
                />
              </Menu>

              <Menu
                description={
                  lastBackupDate
                    ? i18n.t(i18n.l.back_up.cloud.latest_backup, {
                        date: format(lastBackupDate, "M/d/yy 'at' h:mm a"),
                      })
                    : undefined
                }
              >
                <MenuItem
                  hasSfSymbol
                  leftComponent={<MenuItem.TextIcon icon="􀎽" isLink />}
                  onPress={enabledCloudBackups}
                  size={52}
                  titleComponent={
                    <MenuItem.Title
                      isLink
                      text={i18n.t(i18n.l.back_up.cloud.backup_to_cloud_now, {
                        cloudPlatformName: cloudPlatform,
                      })}
                    />
                  }
                />
              </Menu>
            </Stack>

            <Stack space={'24px'}>
              {visibleWallets.map(
                ({
                  name,
                  isBackedUp,
                  accounts,
                  key,
                  numAccounts,
                  backedUp,
                  imported,
                }) => (
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
                          {!backedUp && (
                            <MenuItem.Label
                              color={'#FF584D'}
                              text={i18n.t(
                                i18n.l.back_up.needs_backup.not_backed_up
                              )}
                            />
                          )}
                          {imported && (
                            <MenuItem.Label
                              text={i18n.t(i18n.l.wallet.back_ups.imported)}
                            />
                          )}
                          <MenuItem.Label
                            text={
                              numAccounts > 1
                                ? i18n.t(
                                    i18n.l.wallet.back_ups.wallet_count_gt_one,
                                    {
                                      numAccounts,
                                    }
                                  )
                                : i18n.t(i18n.l.wallet.back_ups.wallet_count, {
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
                      size={numAccounts > 2 ? 52 * (numAccounts / 2) : 52}
                      disabled
                      titleComponent={
                        <Inline verticalSpace="4px" horizontalSpace="4px">
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
                                    : abbreviations.address(address, 3, 5) ||
                                      ''}
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
                      text={i18n.t(
                        i18n.l.back_up.manual.create_new_secret_phrase
                      )}
                    />
                  }
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
                      text={i18n.t(
                        i18n.l.back_up.cloud.manage_platform_backups,
                        {
                          cloudPlatformName: cloudPlatform,
                        }
                      )}
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
                      text={i18n.t(
                        i18n.l.back_up.cloud.cloud_platform_backup_settings,
                        {
                          cloudPlatformName: cloudPlatform,
                        }
                      )}
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
            {visibleWallets.map(
              ({
                name,
                isBackedUp,
                accounts,
                key,
                numAccounts,
                backedUp,
                imported,
              }) => (
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
                        {!backedUp && (
                          <MenuItem.Label
                            color={'#FF584D'}
                            text={i18n.t(
                              i18n.l.back_up.needs_backup.not_backed_up
                            )}
                          />
                        )}
                        {imported && (
                          <MenuItem.Label
                            text={i18n.t(i18n.l.wallet.back_ups.imported)}
                          />
                        )}
                        <MenuItem.Label
                          text={
                            numAccounts > 1
                              ? i18n.t(
                                  i18n.l.wallet.back_ups.wallet_count_gt_one,
                                  {
                                    numAccounts,
                                  }
                                )
                              : i18n.t(i18n.l.wallet.back_ups.wallet_count, {
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
                    size={numAccounts > 2 ? 52 * (numAccounts / 2) : 52}
                    disabled
                    titleComponent={
                      <Inline verticalSpace="4px" horizontalSpace="4px">
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

            <Stack space="36px">
              <Menu>
                <MenuItem
                  hasSfSymbol
                  leftComponent={<MenuItem.TextIcon icon="􀁍" isLink />}
                  onPress={onCreateNewSecretPhrase}
                  size={52}
                  titleComponent={
                    <MenuItem.Title
                      isLink
                      text={i18n.t(
                        i18n.l.back_up.manual.create_new_secret_phrase
                      )}
                    />
                  }
                />
              </Menu>

              <Menu
                description={
                  <Text
                    color="secondary60 (Deprecated)"
                    size="14px / 19px (Deprecated)"
                    weight="regular"
                  >
                    {i18n.t(i18n.l.wallet.back_ups.cloud_backup_description)}

                    <Text
                      onPress={onPressLearnMoreAboutCloudBackups}
                      color="blue"
                      size="14px / 19px (Deprecated)"
                      weight="medium"
                    >
                      {' '}
                      {i18n.t(i18n.l.wallet.back_ups.cloud_backup_link)}
                    </Text>
                  </Text>
                }
              >
                <MenuItem
                  hasSfSymbol
                  leftComponent={<MenuItem.TextIcon icon="􀊯" isLink />}
                  onPress={enabledCloudBackups}
                  size={52}
                  titleComponent={
                    <MenuItem.Title
                      isLink
                      text={i18n.t(i18n.l.back_up.cloud.enable_cloud_backups)}
                    />
                  }
                />
              </Menu>
            </Stack>
          </Stack>
        );
      }
    }
  }, [
    backupProvider,
    enabledCloudBackups,
    onViewCloudBackups,
    lastBackupDate,
    manageCloudBackups,
    navigate,
    onCreateNewSecretPhrase,
    onNavigateToWalletView,
    onPressLearnMoreAboutCloudBackups,
    visibleWallets,
    allBackedUp,
    isDarkMode,
    colors,
  ]);

  return <MenuContainer>{renderView()}</MenuContainer>;
};

export default WalletsAndBackup;
