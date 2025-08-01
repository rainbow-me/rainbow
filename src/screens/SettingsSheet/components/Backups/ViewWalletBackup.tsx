/* eslint-disable no-nested-ternary */
import { ContextCircleButton } from '@/components/context-menu';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { cloudPlatform } from '@/utils/platform';
import Clipboard from '@react-native-clipboard/clipboard';
import { RouteProp, useRoute } from '@react-navigation/native';

import { analytics } from '@/analytics';
import CloudBackedUpIcon from '@/assets/BackedUpCloud.png';
import BackupWarningIcon from '@/assets/BackupWarning.png';
import CloudBackupWarningIcon from '@/assets/CloudBackupWarning.png';
import ManuallyBackedUpIcon from '@/assets/ManuallyBackedUp.png';
import { useCreateBackup } from '@/components/backup/useCreateBackup';
import { ContactAvatar } from '@/components/contacts';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { Box, Stack } from '@/design-system';
import { IS_IOS } from '@/env';
import { removeFirstEmojiFromString } from '@/helpers/emojiHandler';
import showWalletErrorAlert from '@/helpers/support';
import walletBackupTypes from '@/helpers/walletBackupTypes';
import { WalletLoadingStates } from '@/helpers/walletLoadingStates';
import WalletTypes from '@/helpers/walletTypes';
import { useENSAvatar } from '@/hooks';
import * as i18n from '@/languages';
import { logger, RainbowError } from '@/logger';
import { executeFnIfCloudBackupAvailable } from '@/model/backup';
import { RainbowAccount } from '@/model/wallet';
import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { addressCopiedToastAtom } from '@/recoil/addressCopiedToastAtom';
import { backupsStore } from '@/state/backups/backups';
import { walletLoadingStore } from '@/state/walletLoading/walletLoading';
import { createAccountInExistingWallet, formatAccountLabel, getIsDamagedWallet, useWallet } from '@/state/wallets/walletsStore';
import { abbreviations } from '@/utils';
import { addressHashedEmoji } from '@/utils/profileUtils';
import { format } from 'date-fns';
import React, { useCallback, useMemo, useRef } from 'react';
import { InteractionManager } from 'react-native';
import { useRecoilState } from 'recoil';
import { isWalletBackedUpForCurrentAccount } from '../../utils';
import Menu from '../Menu';
import MenuContainer from '../MenuContainer';
import MenuHeader from '../MenuHeader';
import MenuItem from '../MenuItem';
import { BackUpMenuItem } from './BackUpMenuButton';

type ViewWalletBackupParams = {
  ViewWalletBackup: { walletId: string; title: string; imported?: boolean };
};

const enum WalletMenuAction {
  ViewPrivateKey = 'view_private_key',
  CopyWalletAddress = 'copy_wallet_address',
}

type MenuEvent = {
  nativeEvent: {
    actionKey: WalletMenuAction;
  };
  account: RainbowAccount;
};

type WalletAvatarProps = {
  account: RainbowAccount;
};

const WalletAvatar = ({ account }: WalletAvatarProps) => {
  const label = useMemo(() => removeFirstEmojiFromString(account.label), [account.label]);

  const { data: ENSAvatar } = useENSAvatar(label);
  const accountImage = account.emoji || addressHashedEmoji(account.address);

  return ENSAvatar?.imageUrl ? (
    <ImageAvatar image={ENSAvatar.imageUrl} marginRight={12} size="rewards" />
  ) : (
    <ContactAvatar alignSelf="center" color={account.color} marginRight={8} size="small" value={accountImage} />
  );
};

type ContextMenuWrapperProps = {
  children: React.ReactNode;
  account: RainbowAccount;
  menuConfig: {
    menuTitle: string;
    menuItems: {
      actionKey: WalletMenuAction;
      actionTitle: string;
      icon: {
        iconType: string;
        iconValue: string;
      };
    }[];
  };
  onPressMenuItem: (e: MenuEvent) => void;
};

const ContextMenuWrapper = ({ children, account, menuConfig, onPressMenuItem }: ContextMenuWrapperProps) => {
  return IS_IOS ? (
    <ContextMenuButton menuConfig={menuConfig} onPressMenuItem={e => onPressMenuItem({ ...e, account })}>
      {children}
    </ContextMenuButton>
  ) : (
    <ContextCircleButton
      options={menuConfig.menuItems.map(item => item.actionTitle)}
      onPressActionSheet={(buttonIndex: number) => {
        const actionKey = menuConfig.menuItems[buttonIndex].actionKey;
        onPressMenuItem({ nativeEvent: { actionKey }, account });
      }}
    >
      {children}
    </ContextCircleButton>
  );
};

const ViewWalletBackup = () => {
  const { params } = useRoute<RouteProp<ViewWalletBackupParams, typeof Routes.VIEW_WALLET_BACKUP>>();

  const createBackup = useCreateBackup();
  const backupProvider = backupsStore(state => state.backupProvider);
  const mostRecentBackup = backupsStore(state => state.mostRecentBackup);
  const status = backupsStore(state => state.status);

  const { walletId, title: incomingTitle } = params;
  const creatingWallet = useRef<boolean>(false);
  const wallet = useWallet(walletId);

  const isSecretPhrase = WalletTypes.mnemonic === wallet?.type;
  const title = wallet?.type === WalletTypes.privateKey ? wallet?.addresses[0].label : incomingTitle;
  const isBackedUp = isWalletBackedUpForCurrentAccount({
    backupType: wallet?.backupType,
    backedUp: wallet?.backedUp,
    backupFile: wallet?.backupFile,
  });

  const { navigate } = useNavigation();
  const [isToastActive, setToastActive] = useRecoilState(addressCopiedToastAtom);

  const backupWalletsToCloud = useCallback(async () => {
    executeFnIfCloudBackupAvailable({
      fn: () =>
        createBackup({
          walletId,
        }),
    });
  }, [createBackup, walletId]);

  const onNavigateToSecretWarning = useCallback(() => {
    navigate(Routes.SECRET_WARNING, {
      walletId,
      title,
    });
  }, [walletId, title, navigate]);

  const onManualBackup = useCallback(() => {
    navigate(Routes.SECRET_WARNING, {
      walletId,
      isBackingUp: true,
      title,
      backupType: walletBackupTypes.manual,
    });
  }, [navigate, walletId, title]);

  const onCreateNewWallet = useCallback(async () => {
    try {
      if (creatingWallet.current) return;
      creatingWallet.current = true;

      analytics.track(analytics.event.addWalletFlowStarted, {
        isFirstWallet: false,
        type: 'new',
      });

      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          navigate(Routes.MODAL_SCREEN, {
            actionType: 'Create',
            asset: [],
            isNewProfile: true,
            isFromSettings: true,
            onCancel: () => {
              creatingWallet.current = false;
            },
            onCloseModal: async ({ name = '', color = null }) => {
              walletLoadingStore.setState({
                loadingState: WalletLoadingStates.CREATING_WALLET,
              });
              // Check if the selected wallet is the primary
              try {
                // If we found it and it's not damaged use it to create the new account
                if (wallet && !wallet.damaged) {
                  await createAccountInExistingWallet({
                    id: wallet.id,
                    color,
                    name,
                  });
                }
              } catch (e) {
                logger.error(new RainbowError(`[ViewWalletBackup]: Error while trying to add account`, e));
                if (getIsDamagedWallet()) {
                  setTimeout(() => {
                    showWalletErrorAlert();
                  }, 1000);
                }
              } finally {
                walletLoadingStore.setState({
                  loadingState: null,
                });
              }
              creatingWallet.current = false;
            },
            profile: {
              color: null,
              name: '',
            },
            type: 'wallet_profile',
          });
        }, 50);
      });
    } catch (e) {
      logger.error(new RainbowError(`[ViewWalletBackup]: Error while trying to add account`, e));
    }
  }, [navigate, wallet]);

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
        actionTitle: i18n.t(i18n.l.wallet.back_ups.view_private_key),
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'key',
        },
      },
      {
        actionKey: WalletMenuAction.CopyWalletAddress,
        actionTitle: i18n.t(i18n.l.wallet.back_ups.copy_wallet_address),
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'square.on.square',
        },
      },
    ],
  };

  const onPressMenuItem = ({ nativeEvent: { actionKey: menuAction }, account }: MenuEvent) => {
    switch (menuAction) {
      case WalletMenuAction.ViewPrivateKey: {
        const title =
          formatAccountLabel({
            address: account.address,
            ens: abbreviations.abbreviateEnsForDisplay(account.ens ?? undefined, 8, 4),
            label: account.label,
          }) || abbreviations.address(account.address, 6, 4);

        navigate(Routes.SECRET_WARNING, {
          walletId,
          isBackingUp: false,
          privateKeyAddress: account.address,
          title: title ?? '',
        });
        break;
      }
      case WalletMenuAction.CopyWalletAddress: {
        handleCopyAddress(account.address);
        break;
      }
      default:
        break;
    }
  };

  return (
    <MenuContainer>
      {!isBackedUp && (
        <>
          <Menu>
            <MenuHeader
              paddingTop={{ custom: 8 }}
              paddingBottom={{ custom: 24 }}
              iconComponent={
                <MenuHeader.ImageIcon
                  source={backupProvider === walletBackupTypes.cloud ? CloudBackupWarningIcon : BackupWarningIcon}
                  size={72}
                />
              }
              titleComponent={<MenuHeader.Title text={i18n.t(i18n.l.wallet.back_ups.not_backed_up)} weight="heavy" />}
              labelComponent={
                <Box marginTop={{ custom: 16 }}>
                  {backupProvider === walletBackupTypes.cloud && (
                    <MenuHeader.Label
                      text={i18n.t(i18n.l.wallet.back_ups.not_backed_up_to_cloud_message, {
                        backupType: isSecretPhrase ? 'Secret Phrase' : 'Private Key',
                        cloudPlatform,
                      })}
                    />
                  )}
                  {backupProvider !== walletBackupTypes.cloud && (
                    <MenuHeader.Label
                      text={i18n.t(i18n.l.wallet.back_ups.not_backed_up_message, {
                        backupType: isSecretPhrase ? 'Secret Phrase' : 'Private Key',
                      })}
                    />
                  )}
                </Box>
              }
            />
          </Menu>

          <Box>
            <Menu
              description={
                mostRecentBackup && backupProvider === walletBackupTypes.cloud
                  ? i18n.t(i18n.l.back_up.cloud.latest_backup, {
                      date: format(new Date(mostRecentBackup.lastModified), "M/d/yy 'at' h:mm a"),
                    })
                  : undefined
              }
            >
              <BackUpMenuItem
                icon="􀎽"
                title={i18n.t(i18n.l.back_up.cloud.back_up_all_wallets_to_cloud, {
                  cloudPlatformName: cloudPlatform,
                })}
                backupState={status}
                onPress={backupWalletsToCloud}
              />
              <MenuItem
                hasSfSymbol
                leftComponent={<MenuItem.TextIcon icon="􀈊" isLink />}
                onPress={onManualBackup}
                size={52}
                titleComponent={<MenuItem.Title isLink text={i18n.t(i18n.l.back_up.manual.backup_manually)} />}
                testID={'back-up-manually'}
              />
            </Menu>
          </Box>
        </>
      )}

      {isBackedUp && (
        <>
          <Menu>
            <MenuHeader
              paddingTop={{ custom: 8 }}
              paddingBottom={{ custom: 24 }}
              iconComponent={
                <MenuHeader.ImageIcon
                  source={wallet?.backupType === walletBackupTypes.cloud ? CloudBackedUpIcon : ManuallyBackedUpIcon}
                  size={72}
                />
              }
              titleComponent={
                <MenuHeader.Title
                  text={
                    wallet?.backupType === walletBackupTypes.cloud
                      ? i18n.t(i18n.l.wallet.back_ups.backed_up)
                      : i18n.t(i18n.l.wallet.back_ups.backed_up_manually)
                  }
                  weight="heavy"
                  testID={'backed-up-manually'}
                />
              }
              labelComponent={
                <Box marginTop={{ custom: 16 }}>
                  <MenuHeader.Label
                    text={
                      wallet?.backupType === walletBackupTypes.cloud
                        ? i18n.t(i18n.l.wallet.back_ups.backed_up_to_cloud_message, {
                            cloudPlatform,
                          })
                        : i18n.t(i18n.l.wallet.back_ups.backed_up_message, {
                            backupType: isSecretPhrase ? 'Secret Phrase' : 'Private Key',
                          })
                    }
                  />
                </Box>
              }
            />
          </Menu>
        </>
      )}

      {wallet?.backupType === walletBackupTypes.manual && (
        <Box>
          <Menu>
            <BackUpMenuItem
              icon="􀎽"
              title={i18n.t(i18n.l.back_up.cloud.back_up_all_wallets_to_cloud, {
                cloudPlatformName: cloudPlatform,
              })}
              backupState={status}
              onPress={backupWalletsToCloud}
            />
          </Menu>
        </Box>
      )}

      <Box>
        <Menu>
          <MenuItem
            hasSfSymbol
            leftComponent={<MenuItem.TextIcon icon={isSecretPhrase ? '􀉆' : '􀟖'} isLink />}
            onPress={onNavigateToSecretWarning}
            size={52}
            titleComponent={
              <MenuItem.Title
                isLink
                text={isSecretPhrase ? i18n.t(i18n.l.wallet.back_ups.view_secret_phrase) : i18n.t(i18n.l.wallet.back_ups.view_private_key)}
              />
            }
          />
        </Menu>
      </Box>

      <Stack space={'24px'}>
        <Menu>
          {wallet?.addresses
            .filter(a => a.visible)
            .map((account: RainbowAccount) => {
              const nameOrENS = formatAccountLabel({
                address: account.address,
                ens: abbreviations.abbreviateEnsForDisplay(account.ens ?? undefined, 8, 4),
                label: account.label,
              });
              const label = nameOrENS ? abbreviations.address(account.address, 4, 4) : undefined;
              const title = nameOrENS || abbreviations.address(account.address, 4, 4);

              return (
                <ContextMenuWrapper account={account} menuConfig={menuConfig} onPressMenuItem={onPressMenuItem} key={account.address}>
                  <MenuItem
                    testID={'wallet-backup-button'}
                    size={60}
                    disabled
                    leftComponent={<WalletAvatar account={account} />}
                    labelComponent={label ? <MenuItem.Label text={label} /> : null}
                    titleComponent={<MenuItem.Title text={title} weight="semibold" />}
                    rightComponent={<MenuItem.TextIcon disabled icon="􀍡" />}
                  />
                </ContextMenuWrapper>
              );
            })}
        </Menu>

        {wallet?.type !== WalletTypes.privateKey && (
          <Box>
            <Menu description={i18n.t(i18n.l.wallet.back_ups.create_new_wallet_description)}>
              <MenuItem
                hasSfSymbol
                leftComponent={<MenuItem.TextIcon icon="􀁍" isLink />}
                onPress={onCreateNewWallet}
                size={52}
                titleComponent={<MenuItem.Title isLink text={i18n.t(i18n.l.wallet.back_ups.create_new_wallet)} />}
              />
            </Menu>
          </Box>
        )}
      </Stack>
    </MenuContainer>
  );
};

export default ViewWalletBackup;
