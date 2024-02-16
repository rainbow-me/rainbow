import React, { useCallback, useMemo, useState } from 'react';
import { cloudPlatform } from '@/utils/platform';
import Menu from '../Menu';
import MenuContainer from '../MenuContainer';
import MenuItem from '../MenuItem';
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
import { checkWalletsForBackupStatus, checkUserDataForBackupProvider } from '../../utils';
import { Inline, Text, Box, Stack } from '@/design-system';
import { ContactAvatar } from '@/components/contacts';
import { useTheme } from '@/theme';
import Routes from '@/navigation/routesNames';
import { backupsCard } from '@/components/cards/utils/constants';
import { AmendedRainbowWallet, WalletCountPerType, useVisibleWallets } from '../../useVisibleWallets';
import useCloudBackups from '@/hooks/useCloudBackups';
import { SETTINGS_BACKUP_ROUTES } from './routes';
import { RainbowAccount, createWallet } from '@/model/wallet';
import { PROFILES, useExperimentalFlag } from '@/config';
import { useDispatch } from 'react-redux';
import { walletsLoadState } from '@/redux/wallets';
import { RainbowError, logger } from '@/logger';
import { IS_IOS } from '@/env';
import FloatingEmojis from '@/components/floating-emojis/FloatingEmojis';
import { useCreateBackup } from '@/components/backup/useCreateBackup';
import { InteractionManager } from 'react-native';

type WalletPillProps = {
  account: RainbowAccount;
};

export const EmojiEffect = ({
  children,
  deviceWidth,
}: {
  children: (props: { onNewEmoji: () => void }) => React.ReactNode;
  deviceWidth: number;
}) => {
  return (
    <FloatingEmojis
      centerVertically
      distance={600}
      duration={1000}
      emojis={['check_mark_button']}
      marginTop={-10}
      fadeOut={true}
      range={[deviceWidth / 2 - 100, deviceWidth / 2 + 100]}
      gravityEnabled
      scaleTo={0}
      size={100}
      wiggleFactor={0}
    >
      {children}
    </FloatingEmojis>
  );
};
const WalletPill = ({ account }: WalletPillProps) => {
  const { data: ENSAvatar } = useENSAvatar(account.label);
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
        {account.label.endsWith('.eth')
          ? abbreviations.abbreviateEnsForDisplay(account.label, 0, 8) ?? ''
          : abbreviations.address(account.address, 3, 5) ?? ''}
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

  const { backups, userData } = useCloudBackups();
  const dispatch = useDispatch();

  const [walletIdToBackup, setWalletIdToBackup] = useState<string>('');

  const initializeWallet = useInitializeWallet();

  const { onSubmit } = useCreateBackup({
    walletId: walletIdToBackup,
  });

  const { manageCloudBackups } = useManageCloudBackups();

  const walletTypeCount: WalletCountPerType = {
    phrase: 0,
    privateKey: 0,
  };

  const { backupProvider: remoteBackupProvider } = useMemo(() => checkUserDataForBackupProvider(userData), [userData]);
  const { allBackedUp, backupProvider: localBackupProvider } = useMemo(() => checkWalletsForBackupStatus(wallets), [wallets]);

  const backupProvider = useMemo(() => {
    return remoteBackupProvider ?? localBackupProvider;
  }, [localBackupProvider, remoteBackupProvider]);

  const { visibleWallets, lastBackupDate } = useVisibleWallets({ wallets, walletTypeCount });

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

  const getAndSetWalletIdToBackup = useCallback(() => {
    const firstWalletThatNeedsBackedUp = sortedWallets.find(wallet => !wallet.isBackedUp);
    const numberOfWalletsThatNeedBackedUp = sortedWallets.filter(wallet => !wallet.isBackedUp).length;
    if (numberOfWalletsThatNeedBackedUp === 0 || !firstWalletThatNeedsBackedUp) {
      return;
    }
    setWalletIdToBackup(firstWalletThatNeedsBackedUp?.id);
    return {
      firstWalletThatNeedsBackedUp,
      numberOfWalletsThatNeedBackedUp,
    };
  }, [sortedWallets]);

  const showExplainerSheet = useCallback(
    async (wallet: AmendedRainbowWallet) => {
      navigate(Routes.EXPLAIN_SHEET, {
        onClose: () => {
          InteractionManager.runAfterInteractions(() => {
            setTimeout(() => {
              // NOTE: We lose the useState value when we navigate and come back to this screen, so let's set it again
              getAndSetWalletIdToBackup();
              onSubmit();
            }, 300);
          });
        },
        type: 'add_to_backups',
        walletName: wallet.name,
      });
    },
    [navigate, onSubmit, getAndSetWalletIdToBackup]
  );

  const enableCloudBackups = useCallback(() => {
    const data = getAndSetWalletIdToBackup();
    if (!data) {
      return;
    }

    const { firstWalletThatNeedsBackedUp, numberOfWalletsThatNeedBackedUp } = data;
    if (numberOfWalletsThatNeedBackedUp === 1) {
      onSubmit();
    } else {
      showExplainerSheet(firstWalletThatNeedsBackedUp);
    }
  }, [onSubmit, showExplainerSheet, getAndSetWalletIdToBackup]);

  const onViewCloudBackups = useCallback(async () => {
    navigate(SETTINGS_BACKUP_ROUTES.VIEW_CLOUD_BACKUPS, {
      backups,
      title: 'My Cloud Backups',
    });
  }, [backups, navigate]);

  const onCreateNewSecretPhrase = useCallback(async () => {
    try {
      await createWallet({
        color: null,
        name: '',
        clearCallbackOnStartCreation: true,
      });

      await dispatch(walletsLoadState(profilesEnabled));

      // @ts-ignore
      await initializeWallet();
    } catch (err) {
      logger.error(new RainbowError('Failed to create new secret phrase'), {
        extra: {
          error: err,
        },
      });
    }
  }, [dispatch, initializeWallet, profilesEnabled]);

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

            {/* TODO: This is fucked */}
            {/* <Menu description={i18n.t(i18n.l.back_up.cloud.enable_cloud_backups_description)}>
              <MenuItem
                hasSfSymbol
                leftComponent={<MenuItem.TextIcon icon="􀊯" isLink />}
                onPress={enableCloudBackups}
                size={52}
                titleComponent={<MenuItem.Title isLink text={i18n.t(i18n.l.back_up.cloud.enable_cloud_backups)} />}
              />
            </Menu> */}

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
                  iconComponent={<MenuHeader.ImageIcon source={allBackedUp ? WalletsAndBackupIcon : CloudBackupWarningIcon} size={72} />}
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
                        text={i18n.t(i18n.l.wallet.back_ups.cloud_backup_description, {
                          link: i18n.t(i18n.l.wallet.back_ups.cloud_backup_link),
                        })}
                        linkText={i18n.t(i18n.l.wallet.back_ups.cloud_backup_link)}
                        onPress={() =>
                          navigate(Routes.LEARN_WEB_VIEW_SCREEN, {
                            ...backupsCard,
                            type: 'square',
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

              {/* TODO: This is fucked */}
              {/* <Menu
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
                  onPress={enableCloudBackups}
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
              </Menu> */}
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

              {/* TODO: This is fucked */}
              {/* <Menu
                description={
                  <Text color="secondary60 (Deprecated)" size="14px / 19px (Deprecated)" weight="regular">
                    {i18n.t(i18n.l.wallet.back_ups.cloud_backup_description)}

                    <Text onPress={onPressLearnMoreAboutCloudBackups} color="blue" size="14px / 19px (Deprecated)" weight="medium">
                      {' '}
                      {i18n.t(i18n.l.wallet.back_ups.cloud_backup_link)}
                    </Text>
                  </Text>
                }
              >
                <MenuItem
                  hasSfSymbol
                  leftComponent={<MenuItem.TextIcon icon="􀊯" isLink />}
                  onPress={enableCloudBackups}
                  size={52}
                  titleComponent={<MenuItem.Title isLink text={i18n.t(i18n.l.back_up.cloud.enable_cloud_backups)} />}
                />
              </Menu> */}
            </Stack>
          </Stack>
        );
      }
    }
  }, [
    backupProvider,
    sortedWallets,
    onCreateNewSecretPhrase,
    navigate,
    onNavigateToWalletView,
    allBackedUp,
    onViewCloudBackups,
    manageCloudBackups,
  ]);

  return <MenuContainer>{renderView()}</MenuContainer>;
};

export default WalletsAndBackup;
