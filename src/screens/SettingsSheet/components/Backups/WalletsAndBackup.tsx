import CloudBackedUpIcon from '@/assets/BackedUpCloud.png';
import CloudBackupWarningIcon from '@/assets/CloudBackupWarning.png';
import WalletsAndBackupIcon from '@/assets/WalletsAndBackup.png';
import { AbsolutePortalRoot } from '@/components/AbsolutePortal';
import { useCreateBackup } from '@/components/backup/useCreateBackup';
import { backupsCard } from '@/components/cards/utils/constants';
import { ContactAvatar } from '@/components/contacts';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { Box, Inline, Stack, Text } from '@/design-system';
import { IS_ANDROID, IS_DEV, IS_IOS } from '@/env';
import { removeFirstEmojiFromString } from '@/helpers/emojiHandler';
import walletBackupStepTypes from '@/helpers/walletBackupStepTypes';
import WalletBackupTypes from '@/helpers/walletBackupTypes';
import { WalletLoadingStates } from '@/helpers/walletLoadingStates';
import WalletTypes, { EthereumWalletType } from '@/helpers/walletTypes';
import { useENSAvatar, useManageCloudBackups } from '@/hooks';
import * as i18n from '@/languages';
import { RainbowError, logger } from '@/logger';
import { executeFnIfCloudBackupAvailable } from '@/model/backup';
import { RainbowAccount, createWallet } from '@/model/wallet';
import { Navigation, useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { CloudBackupState, backupsStore } from '@/state/backups/backups';
import { walletLoadingStore } from '@/state/walletLoading/walletLoading';
import { loadWallets, useWallets } from '@/state/wallets/walletsStore';
import { useTheme } from '@/theme';
import { abbreviations, deviceUtils } from '@/utils';
import { cloudPlatform } from '@/utils/platform';
import { addressHashedEmoji } from '@/utils/profileUtils';
import { useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import React, { useCallback, useMemo, useRef } from 'react';
import { FlatList, ScrollView } from 'react-native';
import { WalletCountPerType, useVisibleWallets } from '../../useVisibleWallets';
import { checkLocalWalletsForBackupStatus, isWalletBackedUpForCurrentAccount } from '../../utils';
import Menu from '../Menu';
import MenuContainer from '../MenuContainer';
import MenuHeader, { StatusType } from '../MenuHeader';
import MenuItem from '../MenuItem';
import { BackUpMenuItem } from './BackUpMenuButton';
import { initializeWallet } from '@/state/wallets/initializeWallet';

type WalletPillProps = {
  account: RainbowAccount;
};

// constants for the account section
const menuContainerPadding = 19.5; // 19px is the padding on the left and right of the container but we need 1px more to account for the shadows on each container
const accountsContainerWidth = deviceUtils.dimensions.width - menuContainerPadding * 4;
const spaceBetweenAccounts = 4;
const accountsItemWidth = accountsContainerWidth / 3;
const basePadding = 16;
const rowHeight = 36;

const getAccountSectionHeight = (numAccounts: number) => {
  const rows = Math.ceil(Math.max(1, numAccounts) / 3);
  const paddingBetween = (rows - 1) * 4;

  return basePadding + rows * rowHeight - paddingBetween;
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
      backgroundColor={colors.alpha(colors.grey, 0.24)}
      borderRadius={23}
      shadowColor={isDarkMode ? colors.shadow : colors.alpha(colors.blueGreyDark, 0.1)}
      elevation={12}
      shadowOpacity={IS_IOS ? 0.4 : 1}
      shadowRadius={6}
      paddingLeft={{ custom: 4 }}
      paddingRight={{ custom: 8 }}
      padding={{ custom: 4 }}
      width={{ custom: accountsItemWidth }}
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

export const WalletsAndBackup = () => {
  const { navigate } = useNavigation();
  const wallets = useWallets();
  const { name: routeName } = useRoute();

  const scrollviewRef = useRef<ScrollView>(null);

  const createBackup = useCreateBackup();
  const status = backupsStore(state => state.status);
  const backupProvider = backupsStore(state => state.backupProvider);
  const backups = backupsStore(state => state.backups);
  const mostRecentBackup = backupsStore(state => state.mostRecentBackup);

  const { manageCloudBackups } = useManageCloudBackups();

  const walletTypeCount: WalletCountPerType = {
    phrase: 0,
    privateKey: 0,
  };

  const { allBackedUp } = useMemo(() => checkLocalWalletsForBackupStatus(backups), [backups]);

  const visibleWallets = useVisibleWallets({ wallets, walletTypeCount });

  const sortedWallets = useMemo(() => {
    const notBackedUpSecretPhraseWallets = visibleWallets.filter(wallet => !wallet.backedUp && wallet.type === EthereumWalletType.mnemonic);
    const notBackedUpPrivateKeyWallets = visibleWallets.filter(wallet => !wallet.backedUp && wallet.type === EthereumWalletType.privateKey);
    const backedUpSecretPhraseWallets = visibleWallets.filter(wallet => wallet.backedUp && wallet.type === EthereumWalletType.mnemonic);
    const backedUpPrivateKeyWallets = visibleWallets.filter(wallet => wallet.backedUp && wallet.type === EthereumWalletType.privateKey);

    return [
      ...notBackedUpSecretPhraseWallets,
      ...notBackedUpPrivateKeyWallets,
      ...backedUpSecretPhraseWallets,
      ...backedUpPrivateKeyWallets,
    ];
  }, [visibleWallets]);

  const backupAllNonBackedUpWalletsTocloud = useCallback(() => {
    executeFnIfCloudBackupAvailable({
      fn: () => createBackup({}),
    });
  }, [createBackup]);

  const enableCloudBackups = useCallback(() => {
    executeFnIfCloudBackupAvailable({
      fn: async () => {
        // NOTE: For Android we could be coming from a not-logged-in state, so we
        // need to check if we have any wallets to back up first.
        if (IS_ANDROID) {
          const currentBackups = backupsStore.getState().backups;
          if (checkLocalWalletsForBackupStatus(currentBackups).allBackedUp) {
            return;
          }
        }
        return createBackup({});
      },
      logout: true,
    });
  }, [createBackup]);

  const onViewCloudBackups = useCallback(async () => {
    navigate(Routes.VIEW_CLOUD_BACKUPS, {
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
          walletLoadingStore.setState({
            loadingState: WalletLoadingStates.CREATING_WALLET,
          });

          await createWallet({
            color: null,
            name: nameValue,
            clearCallbackOnStartCreation: true,
          });

          await loadWallets();
          await initializeWallet();
        } catch (err) {
          logger.error(new RainbowError(`[WalletsAndBackup]: Failed to create new secret phrase`), {
            error: err,
          });
        } finally {
          walletLoadingStore.setState({
            loadingState: null,
          });
          scrollviewRef.current?.scrollTo({ y: 0, animated: true });
          const step =
            backupProvider === WalletBackupTypes.cloud ? walletBackupStepTypes.backup_prompt_cloud : walletBackupStepTypes.backup_prompt;
          Navigation.handleAction(Routes.BACKUP_SHEET, {
            step,
          });
        }
      },
    });
  }, [navigate, walletTypeCount.phrase, backupProvider]);

  const onPressLearnMoreAboutCloudBackups = useCallback(() => {
    navigate(Routes.LEARN_WEB_VIEW_SCREEN, {
      ...backupsCard,
      displayType: 'square',
      routeName,
    });
  }, [navigate, routeName]);

  const onNavigateToWalletView = useCallback(
    (walletId: string, name: string) => {
      const wallet = wallets?.[walletId];

      const title = wallet?.imported && wallet.type === WalletTypes.privateKey ? (wallet.addresses || [])[0].label : name;
      navigate(Routes.VIEW_WALLET_BACKUP, {
        imported: wallet?.imported ?? false,
        title,
        walletId,
      });
    },
    [navigate, wallets]
  );

  const { status: iconStatusType, text } = useMemo<{ status: StatusType; text: string }>(() => {
    if (!backupProvider) {
      if (status === CloudBackupState.FailedToInitialize || status === CloudBackupState.NotAvailable) {
        return {
          status: 'not-enabled',
          text: i18n.t(i18n.l.back_up.cloud.statuses.not_enabled),
        };
      }

      if (status !== CloudBackupState.Ready) {
        return {
          status: 'out-of-sync',
          text: i18n.t(i18n.l.back_up.cloud.statuses.syncing),
        };
      }

      if (!allBackedUp) {
        return {
          status: 'out-of-date',
          text: i18n.t(i18n.l.back_up.cloud.statuses.out_of_date),
        };
      }

      return {
        status: 'up-to-date',
        text: i18n.t(i18n.l.back_up.cloud.statuses.up_to_date),
      };
    }

    if (status === CloudBackupState.FailedToInitialize || status === CloudBackupState.NotAvailable) {
      return {
        status: 'not-enabled',
        text: i18n.t(i18n.l.back_up.cloud.statuses.not_enabled),
      };
    }

    if (status !== CloudBackupState.Ready) {
      return {
        status: 'out-of-sync',
        text: i18n.t(i18n.l.back_up.cloud.statuses.syncing),
      };
    }

    if (!allBackedUp) {
      return {
        status: 'out-of-date',
        text: i18n.t(i18n.l.back_up.cloud.statuses.out_of_date),
      };
    }

    return {
      status: 'up-to-date',
      text: i18n.t(i18n.l.back_up.cloud.statuses.up_to_date),
    };
  }, [backupProvider, status, allBackedUp]);

  const isCloudBackupDisabled = useMemo(() => {
    return status !== CloudBackupState.Ready && status !== CloudBackupState.NotAvailable;
  }, [status]);

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
                statusComponent={<MenuHeader.StatusIcon status={iconStatusType} text={text} />}
                labelComponent={
                  <MenuHeader.Label
                    text={i18n.t(i18n.l.wallet.back_ups.cloud_backup_description, {
                      link: i18n.t(i18n.l.wallet.back_ups.cloud_backup_link),
                      cloudPlatform,
                    })}
                    linkText={i18n.t(i18n.l.wallet.back_ups.cloud_backup_link)}
                    onPress={onPressLearnMoreAboutCloudBackups}
                  />
                }
              />
            </Menu>

            {IS_DEV && (
              <Box>
                <Menu description="Dev Only: Quick Import/Export Backup">
                  <MenuItem
                    hasSfSymbol
                    leftComponent={<MenuItem.TextIcon icon="⚠️" isLink />}
                    onPress={() => {
                      navigate(Routes.MODAL_SCREEN, {
                        type: 'dev_test_backup',
                      });
                    }}
                    size={52}
                    titleComponent={<MenuItem.Title isLink text="Dev Only: Quick Import/Export Backup" />}
                  />
                </Menu>
              </Box>
            )}

            <Box>
              <Menu description={i18n.t(i18n.l.back_up.cloud.enable_cloud_backups_description)}>
                <BackUpMenuItem
                  title={i18n.t(i18n.l.back_up.cloud.enable_cloud_backups)}
                  backupState={status}
                  disabled={isCloudBackupDisabled}
                  onPress={enableCloudBackups}
                />
              </Menu>
            </Box>

            <Stack space={'24px'}>
              {sortedWallets.map(({ id, name, backedUp, backupFile, backupType, imported, addresses }) => {
                const isBackedUp = isWalletBackedUpForCurrentAccount({ backedUp, backupFile, backupType });

                return (
                  <Menu key={`wallet-${id}`}>
                    <MenuItem
                      hasRightArrow
                      key={`${id}-title`}
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
                          {!isBackedUp && (
                            <MenuItem.Label
                              testID="not-backed-up"
                              color={'#FF584D'}
                              text={i18n.t(i18n.l.back_up.needs_backup.not_backed_up)}
                            />
                          )}
                          {imported && <MenuItem.Label text={i18n.t(i18n.l.wallet.back_ups.imported)} />}
                          <MenuItem.Label
                            text={
                              addresses.length > 1
                                ? i18n.t(i18n.l.wallet.back_ups.wallet_count_gt_one, {
                                    numAccounts: addresses.length,
                                  })
                                : i18n.t(i18n.l.wallet.back_ups.wallet_count, {
                                    numAccounts: addresses.length,
                                  })
                            }
                          />
                        </Inline>
                      }
                      leftComponent={<MenuItem.TextIcon colorOverride={!isBackedUp ? '#FF584D' : ''} icon={isBackedUp ? '􀢶' : '􀡝'} />}
                      onPress={() => onNavigateToWalletView(id, name)}
                      size={60}
                      titleComponent={<MenuItem.Title text={name} />}
                    />
                    <MenuItem
                      key={`${id}-accounts`}
                      size={getAccountSectionHeight(addresses.length)}
                      disabled
                      width="full"
                      titleComponent={
                        <FlatList
                          data={addresses}
                          columnWrapperStyle={{ gap: spaceBetweenAccounts }}
                          contentContainerStyle={{ gap: spaceBetweenAccounts }}
                          renderItem={({ item }) => <WalletPill account={item} />}
                          keyExtractor={item => item.address}
                          numColumns={3}
                          scrollEnabled={false}
                        />
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
                  iconComponent={<MenuHeader.ImageIcon source={allBackedUp ? CloudBackedUpIcon : CloudBackupWarningIcon} size={72} />}
                  titleComponent={<MenuHeader.Title text={i18n.t(i18n.l.wallet.back_ups.cloud_backup_title)} weight="heavy" />}
                  statusComponent={<MenuHeader.StatusIcon status={iconStatusType} text={text} />}
                  labelComponent={
                    allBackedUp ? (
                      <MenuHeader.Label
                        linkText={i18n.t(i18n.l.wallet.back_ups.cloud_backup_link)}
                        onPress={onPressLearnMoreAboutCloudBackups}
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

              <Box>
                <Menu
                  description={
                    mostRecentBackup
                      ? i18n.t(i18n.l.back_up.cloud.latest_backup, {
                          date: format(new Date(mostRecentBackup.lastModified), "M/d/yy 'at' h:mm a"),
                        })
                      : undefined
                  }
                >
                  <BackUpMenuItem
                    title={i18n.t(i18n.l.back_up.cloud.backup_to_cloud_now, {
                      cloudPlatformName: cloudPlatform,
                    })}
                    icon="􀎽"
                    backupState={status}
                    disabled={isCloudBackupDisabled}
                    onPress={backupAllNonBackedUpWalletsTocloud}
                  />
                </Menu>
              </Box>
            </Stack>

            <Stack space={'24px'}>
              {sortedWallets.map(({ id, name, backedUp, backupFile, backupType, imported, addresses }) => {
                const isBackedUp = isWalletBackedUpForCurrentAccount({ backedUp, backupFile, backupType });

                return (
                  <Menu key={`wallet-${id}`}>
                    <MenuItem
                      hasRightArrow
                      key={`${id}-title`}
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
                          {!isBackedUp && (
                            <MenuItem.Label
                              testID={`${id}-not-backed-up`}
                              color={'#FF584D'}
                              text={i18n.t(i18n.l.back_up.needs_backup.not_backed_up)}
                            />
                          )}
                          {imported && <MenuItem.Label text={i18n.t(i18n.l.wallet.back_ups.imported)} />}
                          <MenuItem.Label
                            text={
                              addresses.length > 1
                                ? i18n.t(i18n.l.wallet.back_ups.wallet_count_gt_one, {
                                    numAccounts: addresses.length,
                                  })
                                : i18n.t(i18n.l.wallet.back_ups.wallet_count, {
                                    numAccounts: addresses.length,
                                  })
                            }
                          />
                        </Inline>
                      }
                      leftComponent={<MenuItem.TextIcon colorOverride={!isBackedUp ? '#FF584D' : ''} icon={isBackedUp ? '􀢶' : '􀡝'} />}
                      onPress={() => onNavigateToWalletView(id, name)}
                      size={60}
                      titleComponent={<MenuItem.Title text={name} />}
                    />
                    <MenuItem
                      key={`${id}-accounts`}
                      size={getAccountSectionHeight(addresses.length)}
                      disabled
                      width="full"
                      titleComponent={
                        <FlatList
                          data={addresses}
                          columnWrapperStyle={{ gap: spaceBetweenAccounts }}
                          contentContainerStyle={{ gap: spaceBetweenAccounts }}
                          renderItem={({ item }) => <WalletPill account={item} />}
                          keyExtractor={item => item.address}
                          numColumns={3}
                          scrollEnabled={false}
                        />
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
            {sortedWallets.map(({ id, name, backedUp, backupType, backupFile, imported, addresses }) => {
              const isBackedUp = isWalletBackedUpForCurrentAccount({ backedUp, backupType, backupFile });
              return (
                <Menu key={`wallet-${id}`}>
                  <MenuItem
                    hasRightArrow
                    key={`${id}-title`}
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
                        {!isBackedUp && (
                          <MenuItem.Label
                            testID={`${id}-not-backed-up`}
                            color={'#FF584D'}
                            text={i18n.t(i18n.l.back_up.needs_backup.not_backed_up)}
                          />
                        )}
                        {imported && <MenuItem.Label testID={'back-ups-imported'} text={i18n.t(i18n.l.wallet.back_ups.imported)} />}
                        <MenuItem.Label
                          text={
                            addresses.length > 1
                              ? i18n.t(i18n.l.wallet.back_ups.wallet_count_gt_one, {
                                  numAccounts: addresses.length,
                                })
                              : i18n.t(i18n.l.wallet.back_ups.wallet_count, {
                                  numAccounts: addresses.length,
                                })
                          }
                        />
                      </Inline>
                    }
                    leftComponent={<MenuItem.TextIcon colorOverride={!isBackedUp ? '#FF584D' : ''} icon={isBackedUp ? '􀢶' : '􀡝'} />}
                    onPress={() => onNavigateToWalletView(id, name)}
                    size={60}
                    titleComponent={<MenuItem.Title text={name} />}
                  />
                  <MenuItem
                    key={`${id}-accounts`}
                    size={getAccountSectionHeight(addresses.length)}
                    disabled
                    width="full"
                    titleComponent={
                      <FlatList
                        data={addresses}
                        columnWrapperStyle={{ gap: spaceBetweenAccounts }}
                        contentContainerStyle={{ gap: spaceBetweenAccounts }}
                        renderItem={({ item }) => <WalletPill account={item} />}
                        keyExtractor={item => item.address}
                        numColumns={3}
                        scrollEnabled={false}
                      />
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

              <Box>
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
                    backupState={status}
                    onPress={backupAllNonBackedUpWalletsTocloud}
                    disabled={status !== CloudBackupState.Ready}
                  />
                </Menu>
              </Box>
            </Stack>
          </Stack>
        );
      }
    }
  }, [
    backupProvider,
    iconStatusType,
    text,
    status,
    isCloudBackupDisabled,
    enableCloudBackups,
    sortedWallets,
    onCreateNewSecretPhrase,
    onNavigateToWalletView,
    allBackedUp,
    mostRecentBackup,
    backupAllNonBackedUpWalletsTocloud,
    onViewCloudBackups,
    manageCloudBackups,
    onPressLearnMoreAboutCloudBackups,
  ]);

  return (
    <MenuContainer scrollviewRef={scrollviewRef}>
      <AbsolutePortalRoot style={{ zIndex: 100 }} />
      {renderView()}
    </MenuContainer>
  );
};

export default WalletsAndBackup;
