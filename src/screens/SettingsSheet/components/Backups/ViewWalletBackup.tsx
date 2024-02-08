import { RouteProp, useRoute } from '@react-navigation/native';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { ContextCircleButton } from '@/components/context-menu';
import Clipboard from '@react-native-community/clipboard';
import { cloudPlatform } from '@/utils/platform';
import { address as formatAddress } from '@/utils/abbreviations';

import * as i18n from '@/languages';
import React, { useCallback, useRef } from 'react';
import Menu from '../Menu';
import MenuContainer from '../MenuContainer';
import MenuItem from '../MenuItem';
import BackupWarningIcon from '@/assets/BackupWarning.png';
import CloudBackedUpIcon from '@/assets/BackedUpCloud.png';
import ManuallyBackedUpIcon from '@/assets/ManuallyBackedUp.png';
import { removeFirstEmojiFromString } from '@/helpers/emojiHandler';
import { useInitializeWallet, useWallets } from '@/hooks';
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
import Routes from '@/navigation/routesNames';
import walletBackupTypes from '@/helpers/walletBackupTypes';
import { SETTINGS_BACKUP_ROUTES } from './routes';
import { analyticsV2 } from '@/analytics';
import { InteractionManager } from 'react-native';
import { useDispatch } from 'react-redux';
import { createAccountForWallet, walletsLoadState } from '@/redux/wallets';
import { backupUserDataIntoCloud } from '@/handlers/cloudBackup';
import { logger, RainbowError } from '@/logger';
import { captureException } from '@sentry/react-native';
import { createWallet } from '@/model/wallet';
import { PROFILES, useExperimentalFlag } from '@/config';
import showWalletErrorAlert from '@/helpers/support';
import { IS_IOS } from '@/env';

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
  address: string;
};

const ViewWalletBackup = () => {
  const { params } = useRoute<RouteProp<ViewWalletBackupParams, 'ViewWalletBackup'>>();

  const { walletId, title: incomingTitle } = params;
  const creatingWallet = useRef<boolean>();
  const { isDamaged, wallets } = useWallets();
  const wallet = wallets?.[walletId];
  const dispatch = useDispatch();
  const initializeWallet = useInitializeWallet();
  const profilesEnabled = useExperimentalFlag(PROFILES);

  const isSecretPhrase = WalletTypes.mnemonic === wallet?.type;

  const title = wallet?.type === WalletTypes.privateKey ? wallet?.addresses[0].label : incomingTitle;

  const { navigate } = useNavigation();
  const [isToastActive, setToastActive] = useRecoilState(addressCopiedToastAtom);

  const enableCloudBackups = useCallback(() => {
    navigate(Routes.BACKUP_SHEET, {
      nativeScreen: true,
      step: walletBackupStepTypes.backup_cloud,
      walletId,
    });
  }, [navigate, walletId]);

  const onNavigateToSecretWarning = useCallback(() => {
    navigate(SETTINGS_BACKUP_ROUTES.SECRET_WARNING, {
      walletId,
      title,
    });
  }, [walletId, title, navigate]);

  const onManualBackup = useCallback(() => {
    navigate(SETTINGS_BACKUP_ROUTES.SECRET_WARNING, {
      walletId,
      isBackingUp: true,
      title,
      backupType: walletBackupTypes.manual,
    });
  }, [navigate, walletId, title]);

  const onCreateNewWallet = useCallback(async () => {
    try {
      analyticsV2.track(analyticsV2.event.addWalletFlowStarted, {
        isFirstWallet: false,
        type: 'new',
      });
      if (creatingWallet.current) return;
      creatingWallet.current = true;

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
            onCloseModal: async (args: any) => {
              if (args) {
                const name = args?.name ?? '';
                const color = args?.color ?? null;
                // Check if the selected wallet is the primary
                let primaryWalletKey = wallet?.primary ? wallet.id : null;

                // If it's not, then find it
                !primaryWalletKey &&
                  Object.keys(wallets || {}).some(key => {
                    const wallet = wallets?.[key];
                    if (wallet?.type === WalletTypes.mnemonic && wallet.primary) {
                      primaryWalletKey = key;
                      return true;
                    }
                    return false;
                  });

                // If there's no primary wallet at all,
                // we fallback to an imported one with a seed phrase
                !primaryWalletKey &&
                  Object.keys(wallets as any).some(key => {
                    const wallet = wallets?.[key];
                    if (wallet?.type === WalletTypes.mnemonic && wallet.imported) {
                      primaryWalletKey = key;
                      return true;
                    }
                    return false;
                  });
                try {
                  // If we found it and it's not damaged use it to create the new account
                  if (primaryWalletKey && !wallets?.[primaryWalletKey].damaged) {
                    const newWallets = await dispatch(createAccountForWallet(primaryWalletKey, color, name));
                    // @ts-ignore
                    await initializeWallet();
                    // If this wallet was previously backed up to the cloud
                    // We need to update userData backup so it can be restored too
                    if (wallets?.[primaryWalletKey].backedUp && wallets[primaryWalletKey].backupType === walletBackupTypes.cloud) {
                      try {
                        await backupUserDataIntoCloud({ wallets: newWallets });
                      } catch (e) {
                        logger.error(e as RainbowError, {
                          description: 'Updating wallet userdata failed after new account creation',
                        });
                        captureException(e);
                        throw e;
                      }
                    }

                    // If doesn't exist, we need to create a new wallet
                  } else {
                    await createWallet({
                      color,
                      name,
                      clearCallbackOnStartCreation: true,
                    });
                    await dispatch(walletsLoadState(profilesEnabled));
                    // @ts-ignore
                    await initializeWallet();
                  }
                } catch (e) {
                  logger.error(e as RainbowError, {
                    description: 'Error while trying to add account',
                  });
                  captureException(e);
                  if (isDamaged) {
                    setTimeout(() => {
                      showWalletErrorAlert();
                    }, 1000);
                  }
                }
              }
              creatingWallet.current = false;
            },
            profile: {
              color: null,
              name: ``,
            },
            type: 'wallet_profile',
          });
        }, 50);
      });
    } catch (e) {
      logger.error(e as RainbowError, {
        description: 'Error while trying to add account',
      });
    }
  }, [creatingWallet, dispatch, isDamaged, navigate, initializeWallet, profilesEnabled, wallets, wallet]);

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

  const onPressMenuItem = ({ nativeEvent: { actionKey: menuAction }, address }: MenuEvent) => {
    switch (menuAction) {
      case WalletMenuAction.ViewPrivateKey: {
        // TODO: How do we get the private key from an individual account inside of a wallet?
        navigate('SecretWarning', {
          walletId,
          isBackingUp: false,
          privateKeyAddress: address,
          title: formatAddress(address, 4, 5),
        });
        break;
      }
      case WalletMenuAction.CopyWalletAddress: {
        handleCopyAddress(address);
        break;
      }
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
              iconComponent={<MenuHeader.ImageIcon source={BackupWarningIcon} size={72} />}
              titleComponent={<MenuHeader.Title text={i18n.t(i18n.l.wallet.back_ups.not_backed_up)} weight="heavy" />}
              labelComponent={
                <Box marginTop={{ custom: 16 }}>
                  <MenuHeader.Label
                    text={i18n.t(i18n.l.wallet.back_ups.not_backed_up_message, {
                      backupType: isSecretPhrase ? 'Secret Phrase' : 'Private Key',
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
              titleComponent={<MenuItem.Title isLink text={i18n.t(i18n.l.back_up.cloud.enable_cloud_backups)} />}
            />
            <MenuItem
              hasSfSymbol
              leftComponent={<MenuItem.TextIcon icon="􀈊" isLink />}
              onPress={onManualBackup}
              size={52}
              titleComponent={<MenuItem.Title isLink text={i18n.t(i18n.l.back_up.manual.backup_manually)} />}
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
                <MenuHeader.ImageIcon
                  source={wallet.backupType === walletBackupTypes.cloud ? CloudBackedUpIcon : ManuallyBackedUpIcon}
                  size={72}
                />
              }
              titleComponent={
                <MenuHeader.Title
                  text={
                    wallet.backupType === walletBackupTypes.cloud
                      ? i18n.t(i18n.l.wallet.back_ups.backed_up)
                      : i18n.t(i18n.l.wallet.back_ups.backed_up_manually)
                  }
                  weight="heavy"
                />
              }
              labelComponent={
                <Box marginTop={{ custom: 16 }}>
                  <MenuHeader.Label
                    text={
                      wallet.backupType === walletBackupTypes.cloud
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

          <Menu>
            <MenuItem
              hasSfSymbol
              leftComponent={<MenuItem.TextIcon icon={isSecretPhrase ? '􀉆' : '􀟖'} isLink />}
              onPress={onNavigateToSecretWarning}
              size={52}
              titleComponent={
                <MenuItem.Title
                  isLink
                  text={
                    isSecretPhrase ? i18n.t(i18n.l.wallet.back_ups.view_secret_phrase) : i18n.t(i18n.l.wallet.back_ups.view_private_key)
                  }
                />
              }
            />
          </Menu>
        </>
      )}

      <Stack space={'24px'}>
        <Menu>
          {wallet?.addresses
            .filter(a => a.visible)
            .map(({ address, label, image, color, avatar }) => (
              <MenuItem
                key={address}
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
                labelComponent={label.endsWith('.eth') ? <MenuItem.Label text={abbreviations.address(address, 3, 5) || ''} /> : null}
                titleComponent={
                  <MenuItem.Title
                    text={label.endsWith('.eth') ? removeFirstEmojiFromString(label) : abbreviations.address(address, 3, 5) || ''}
                    weight="semibold"
                  />
                }
                rightComponent={
                  IS_IOS ? (
                    <ContextMenuButton menuConfig={menuConfig} onPressMenuItem={(e: MenuEvent) => onPressMenuItem({ ...e, address })}>
                      <MenuItem.TextIcon icon="􀍡" />
                    </ContextMenuButton>
                  ) : (
                    <ContextCircleButton
                      options={menuConfig.menuItems.map(item => item.actionTitle)}
                      onPressActionSheet={(buttonIndex: number) => {
                        const actionKey = menuConfig.menuItems[buttonIndex].actionKey;
                        onPressMenuItem({ nativeEvent: { actionKey }, address });
                      }}
                    >
                      <MenuItem.TextIcon icon="􀍡" />
                    </ContextCircleButton>
                  )
                }
              />
            ))}
        </Menu>

        {wallet?.type !== WalletTypes.privateKey && (
          <Menu description={i18n.t(i18n.l.wallet.back_ups.create_new_wallet_description)}>
            <MenuItem
              hasSfSymbol
              leftComponent={<MenuItem.TextIcon icon="􀁍" isLink />}
              onPress={onCreateNewWallet}
              size={52}
              titleComponent={<MenuItem.Title isLink text={i18n.t(i18n.l.wallet.back_ups.create_new_wallet)} />}
            />
          </Menu>
        )}
      </Stack>
    </MenuContainer>
  );
};

export default ViewWalletBackup;
