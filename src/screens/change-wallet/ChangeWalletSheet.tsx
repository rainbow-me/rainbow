import { RouteProp, useRoute } from '@react-navigation/native';
import * as i18n from '@/languages';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, InteractionManager, View } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useDispatch } from 'react-redux';
import { ButtonPressAnimation } from '@/components/animations';
import { WalletList } from '@/components/change-wallet/WalletList';
import { removeWalletData } from '../../handlers/localstorage/removeWallet';
import { cleanUpWalletKeys, RainbowWallet } from '../../model/wallet';
import { useNavigation } from '../../navigation/Navigation';
import { addressSetSelected, walletsSetSelected, walletsUpdate } from '../../redux/wallets';
import WalletTypes from '@/helpers/walletTypes';
import { analytics, analyticsV2 } from '@/analytics';
import { useAccountSettings, useInitializeWallet, useWallets, useWalletsWithBalancesAndNames, useWebData } from '@/hooks';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { doesWalletsContainAddress, showActionSheetWithOptions } from '@/utils';
import { logger, RainbowError } from '@/logger';
import { useTheme } from '@/theme';
import { EthereumAddress } from '@/entities';
import { getNotificationSettingsForWalletWithAddress } from '@/notifications/settings/storage';
import { DEVICE_HEIGHT } from '@/utils/deviceUtils';
import { IS_ANDROID } from '@/env';
import { remotePromoSheetsStore } from '@/state/remotePromoSheets/remotePromoSheets';
import { RootStackParamList } from '@/navigation/types';
import { address } from '@/utils/abbreviations';
import { removeFirstEmojiFromString } from '@/helpers/emojiHandler';
import { Box, Stack, Text } from '@/design-system';
import { addDisplay } from '@/helpers/utilities';
import { Panel, TapToDismiss } from '@/components/SmoothPager/ListPanel';
import { SheetHandleFixedToTop } from '@/components/sheet';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { MenuConfig, MenuItem } from '@/components/DropdownMenu';
import { NOTIFICATIONS, useExperimentalFlag } from '@/config';

const LIST_PADDING_BOTTOM = 6;
const MAX_LIST_HEIGHT = DEVICE_HEIGHT - 220;
const WALLET_ROW_HEIGHT = 59;
const WATCH_ONLY_BOTTOM_PADDING = IS_ANDROID ? 20 : 0;

// TODO: calc
const PANEL_BOTTOM_OFFSET = 41;

export const MAX_PANEL_HEIGHT = 640;
export const PANEL_HEADER_HEIGHT = 58;
export const FOOTER_HEIGHT = 91;

export enum AddressMenuAction {
  Edit = 'edit',
  Notifications = 'notifications',
  Remove = 'remove',
  Copy = 'copy',
  Settings = 'settings',
}

export type AddressMenuActionData = {
  address: string;
};

const RowTypes = {
  ADDRESS: 1,
  EMPTY: 2,
};

const Whitespace = styled(View)({
  backgroundColor: ({ theme: { colors } }: any) => colors.white,
  bottom: -398,
  height: 400,
  position: 'absolute',
  width: '100%',
});

// TODO:
const getWalletListHeight = (wallets: any, watchOnly: boolean) => {
  let listHeight = !watchOnly ? FOOTER_HEIGHT + LIST_PADDING_BOTTOM : WATCH_ONLY_BOTTOM_PADDING;

  if (wallets) {
    for (const key of Object.keys(wallets)) {
      const visibleAccounts = wallets[key].addresses.filter((account: any) => account.visible);
      listHeight += visibleAccounts.length * WALLET_ROW_HEIGHT;

      if (listHeight > MAX_LIST_HEIGHT) {
        return { listHeight: MAX_LIST_HEIGHT, scrollEnabled: true };
      }
    }
  }
  return { listHeight, scrollEnabled: false };
};

export interface AddressItem {
  address: EthereumAddress;
  color: number;
  editMode: boolean;
  height: number;
  id: EthereumAddress;
  isOnlyAddress: boolean;
  isReadOnly: boolean;
  isLedger: boolean;
  isSelected: boolean;
  label: string;
  secondaryLabel: string;
  rowType: number;
  walletId: string;
  image: string | null | undefined;
}

export default function ChangeWalletSheet() {
  const { params = {} } = useRoute<RouteProp<RootStackParamList, 'ChangeWalletSheet'>>();

  const { onChangeWallet, watchOnly = false, currentAccountAddress } = params;
  const { selectedWallet, wallets } = useWallets();
  const notificationsEnabled = useExperimentalFlag(NOTIFICATIONS);

  const { colors } = useTheme();
  const { updateWebProfile } = useWebData();
  const { accountAddress, network } = useAccountSettings();
  const { goBack, navigate, setParams } = useNavigation();
  const dispatch = useDispatch();
  const initializeWallet = useInitializeWallet();
  const walletsWithBalancesAndNames = useWalletsWithBalancesAndNames();

  const [editMode, setEditMode] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(currentAccountAddress || accountAddress);
  const [currentSelectedWallet, setCurrentSelectedWallet] = useState(selectedWallet);

  const walletsByAddress = useMemo(() => {
    return Object.values(wallets || {}).reduce(
      (acc, wallet) => {
        wallet.addresses.forEach(account => {
          acc[account.address] = wallet;
        });
        return acc;
      },
      {} as Record<EthereumAddress, RainbowWallet>
    );
  }, [wallets]);

  // TODO: maybe wallet accounts is a better name
  const allWalletItems = useMemo(() => {
    const sortedWallets: AddressItem[] = [];
    const bluetoothWallets: AddressItem[] = [];
    const readOnlyWallets: AddressItem[] = [];

    Object.values(walletsWithBalancesAndNames).forEach(wallet => {
      const visibleAccounts = (wallet.addresses || []).filter(account => account.visible);
      visibleAccounts.forEach(account => {
        const balanceText = account.balancesMinusHiddenBalances
          ? account.balancesMinusHiddenBalances
          : i18n.t(i18n.l.wallet.change_wallet.loading_balance);

        const item: AddressItem = {
          id: account.address,
          address: account.address,
          image: account.image,
          color: account.color,
          editMode,
          height: WALLET_ROW_HEIGHT,
          label: removeFirstEmojiFromString(account.label) || address(account.address, 6, 4),
          // TODO: what does this do?
          // label:
          //   network !== Network.mainnet && account.ens === account.label
          //     ? address(account.address, 6, 4)
          //     : removeFirstEmojiFromString(account.label),
          secondaryLabel: balanceText,
          isOnlyAddress: visibleAccounts.length === 1,
          isLedger: wallet.type === WalletTypes.bluetooth,
          isReadOnly: wallet.type === WalletTypes.readOnly,
          isSelected: account.address === currentAddress,
          rowType: RowTypes.ADDRESS,
          walletId: wallet?.id,
        };

        if ([WalletTypes.mnemonic, WalletTypes.seed, WalletTypes.privateKey].includes(wallet.type)) {
          sortedWallets.push(item);
        } else if (wallet.type === WalletTypes.bluetooth) {
          bluetoothWallets.push(item);
        } else if (wallet.type === WalletTypes.readOnly) {
          readOnlyWallets.push(item);
        }
      });
    });

    // sorts by order wallets were added
    return [...sortedWallets, ...bluetoothWallets, ...readOnlyWallets].sort((a, b) => a.walletId.localeCompare(b.walletId));
  }, [walletsWithBalancesAndNames, currentAddress, editMode, network]);

  // TODO: maybe move this to its own hook
  const ownedWalletsTotalBalance = useMemo(() => {
    let isLoadingBalance = false;

    const totalBalance = Object.values(walletsWithBalancesAndNames).reduce((acc, wallet) => {
      // only include owned wallet balances
      if (wallet.type === WalletTypes.readOnly) return acc;

      const visibleAccounts = wallet.addresses.filter(account => account.visible);

      // TODO: if these are not in the native currency 0 format the end number will also not have the format
      let walletTotalBalance = '0';

      visibleAccounts.forEach(account => {
        if (!account.balancesMinusHiddenBalances) {
          isLoadingBalance = true;
        }
        walletTotalBalance = addDisplay(walletTotalBalance, account.balancesMinusHiddenBalances || '0');
      });

      return addDisplay(acc, walletTotalBalance);
    }, '0');

    if (isLoadingBalance) return i18n.t(i18n.l.wallet.change_wallet.loading_balance);

    return totalBalance;
  }, [walletsWithBalancesAndNames]);

  const onChangeAccount = useCallback(
    async (walletId: string, address: string, fromDeletion = false) => {
      if (editMode && !fromDeletion) return;
      const wallet = wallets?.[walletId];
      if (!wallet) return;
      if (watchOnly && onChangeWallet) {
        setCurrentAddress(address);
        setCurrentSelectedWallet(wallet);
        onChangeWallet(address, wallet);
        return;
      }
      if (address === currentAddress) return;
      try {
        setCurrentAddress(address);
        setCurrentSelectedWallet(wallet);
        const p1 = dispatch(walletsSetSelected(wallet));
        const p2 = dispatch(addressSetSelected(address));
        await Promise.all([p1, p2]);
        remotePromoSheetsStore.setState({ isShown: false });
        // @ts-expect-error initializeWallet is not typed correctly
        initializeWallet(null, null, null, false, false, null, true);
        if (!fromDeletion) {
          goBack();
        }
      } catch (e) {
        logger.error(new RainbowError('[ChangeWalletSheet]: Error while switching account'), {
          error: e,
        });
      }
    },
    [currentAddress, dispatch, editMode, goBack, initializeWallet, onChangeWallet, wallets, watchOnly]
  );

  const deleteWallet = useCallback(
    async (walletId: string, address: string) => {
      const currentWallet = wallets?.[walletId];
      // There's nothing to delete if there's no wallet
      if (!currentWallet) return;

      const newWallets = {
        ...wallets,
        [walletId]: {
          ...currentWallet,
          addresses: (currentWallet.addresses || []).map(account =>
            account.address.toLowerCase() === address.toLowerCase() ? { ...account, visible: false } : account
          ),
        },
      };
      // If there are no visible wallets
      // then delete the wallet
      const visibleAddresses = ((newWallets as any)[walletId]?.addresses || []).filter((account: any) => account.visible);
      if (visibleAddresses.length === 0) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete newWallets[walletId];
        dispatch(walletsUpdate(newWallets));
      } else {
        dispatch(walletsUpdate(newWallets));
      }
      removeWalletData(address);
    },
    [dispatch, wallets]
  );

  const renameWallet = useCallback(
    (walletId: string, address: string) => {
      const wallet = wallets?.[walletId];
      if (!wallet) return;
      const account = wallet.addresses?.find(account => account.address === address);

      InteractionManager.runAfterInteractions(() => {
        goBack();
      });

      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          navigate(Routes.MODAL_SCREEN, {
            address,
            asset: [],
            onCloseModal: async (args: any) => {
              if (args) {
                if ('name' in args) {
                  analytics.track('Tapped "Done" after editing wallet', {
                    wallet_label: args.name,
                  });

                  const walletAddresses = wallets[walletId].addresses;
                  const walletAddressIndex = walletAddresses.findIndex(account => account.address === address);
                  const walletAddress = walletAddresses[walletAddressIndex];

                  const updatedWalletAddress = {
                    ...walletAddress,
                    color: args.color,
                    label: args.name,
                  };
                  const updatedWalletAddresses = [...walletAddresses];
                  updatedWalletAddresses[walletAddressIndex] = updatedWalletAddress;

                  const updatedWallet = {
                    ...wallets[walletId],
                    addresses: updatedWalletAddresses,
                  };
                  const updatedWallets = {
                    ...wallets,
                    [walletId]: updatedWallet,
                  };

                  if (currentSelectedWallet.id === walletId) {
                    setCurrentSelectedWallet(updatedWallet);
                    dispatch(walletsSetSelected(updatedWallet));
                  }

                  updateWebProfile(address, args.name, colors.avatarBackgrounds[args.color]);

                  dispatch(walletsUpdate(updatedWallets));
                } else {
                  analytics.track('Tapped "Cancel" after editing wallet');
                }
              }
            },
            profile: {
              color: account?.color,
              image: account?.image || ``,
              name: account?.label || ``,
            },
            type: 'wallet_profile',
          });
        }, 50);
      });
    },
    [wallets, goBack, navigate, dispatch, currentSelectedWallet.id, updateWebProfile, colors.avatarBackgrounds]
  );

  const onPressEdit = useCallback(
    (walletId: string, address: string) => {
      analytics.track('Tapped "Edit Wallet"');
      renameWallet(walletId, address);
    },
    [renameWallet]
  );

  const onPressNotifications = useCallback(
    (walletName: string, address: string) => {
      analytics.track('Tapped "Notification Settings"');
      const walletNotificationSettings = getNotificationSettingsForWalletWithAddress(address);
      if (walletNotificationSettings) {
        navigate(Routes.SETTINGS_SHEET, {
          params: {
            address,
            title: walletName,
            notificationSettings: walletNotificationSettings,
          },
          screen: Routes.WALLET_NOTIFICATIONS_SETTINGS,
        });
      } else {
        Alert.alert(i18n.t(i18n.l.wallet.action.notifications.alert_title), i18n.t(i18n.l.wallet.action.notifications.alert_message), [
          { text: 'OK' },
        ]);
      }
    },
    [navigate]
  );

  const onPressRemove = useCallback(
    (walletId: string, address: string) => {
      analytics.track('Tapped "Delete Wallet"');
      // If there's more than 1 account
      // it's deletable
      let isLastAvailableWallet = false;
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < Object.keys(wallets as any).length; i++) {
        const key = Object.keys(wallets as any)[i];
        const someWallet = wallets?.[key];
        const otherAccount = someWallet?.addresses.find(account => account.visible && account.address !== address);
        if (otherAccount) {
          isLastAvailableWallet = true;
          break;
        }
      }
      // Delete wallet with confirmation
      showActionSheetWithOptions(
        {
          cancelButtonIndex: 1,
          destructiveButtonIndex: 0,
          message: i18n.t(i18n.l.wallet.action.remove_confirm),
          options: [i18n.t(i18n.l.wallet.action.remove), i18n.t(i18n.l.button.cancel)],
        },
        async (buttonIndex: number) => {
          if (buttonIndex === 0) {
            analytics.track('Tapped "Delete Wallet" (final confirm)');
            await deleteWallet(walletId, address);
            ReactNativeHapticFeedback.trigger('notificationSuccess');
            if (!isLastAvailableWallet) {
              await cleanUpWalletKeys();
              goBack();
              navigate(Routes.WELCOME_SCREEN);
            } else {
              // If we're deleting the selected wallet
              // we need to switch to another one
              if (wallets && address === currentAddress) {
                const { wallet: foundWallet, key } =
                  doesWalletsContainAddress({
                    address: address,
                    wallets,
                  }) || {};
                if (foundWallet && key) {
                  await onChangeAccount(key, foundWallet.address, true);
                }
              }
            }
          }
        }
      );
    },
    [currentAddress, deleteWallet, goBack, navigate, onChangeAccount, wallets]
  );

  // const onPressPairHardwareWallet = useCallback(() => {
  //   analyticsV2.track(analyticsV2.event.addWalletFlowStarted, {
  //     isFirstWallet: false,
  //     type: 'ledger_nano_x',
  //   });
  //   goBack();
  //   InteractionManager.runAfterInteractions(() => {
  //     navigate(Routes.PAIR_HARDWARE_WALLET_NAVIGATOR, {
  //       entryPoint: Routes.CHANGE_WALLET_SHEET,
  //       isFirstWallet: false,
  //     });
  //   });
  // }, [goBack, navigate]);

  const onPressAddAnotherWallet = useCallback(() => {
    analyticsV2.track(analyticsV2.event.pressedButton, {
      buttonName: 'AddAnotherWalletButton',
      action: 'Navigates from WalletList to AddWalletSheet',
    });
    goBack();
    InteractionManager.runAfterInteractions(() => {
      navigate(Routes.ADD_WALLET_NAVIGATOR, {
        isFirstWallet: false,
      });
    });
  }, [goBack, navigate]);

  const onPressEditMode = useCallback(() => {
    analytics.track('Tapped "Edit"');
    setEditMode(e => !e);
  }, []);

  const onPressAccount = useCallback(
    (address: string) => {
      const wallet = walletsByAddress[address];
      if (!wallet) {
        logger.error(new RainbowError('[ChangeWalletSheet]: No wallet for address found when pressing account'), {
          address,
        });
        return;
      }
      onChangeAccount(wallet.id, address);
    },
    [onChangeAccount, walletsByAddress]
  );

  const addressMenuConfig = useMemo<MenuConfig<AddressMenuAction>>(() => {
    let menuItems = [
      {
        actionKey: AddressMenuAction.Edit,
        // TODO: localize
        actionTitle: 'Edit Wallet',
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'pencil',
        },
      },
      {
        actionKey: AddressMenuAction.Copy,
        actionTitle: 'Copy Address',
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'doc.fill',
        },
      },
      {
        actionKey: AddressMenuAction.Settings,
        actionTitle: 'Wallet Settings',
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'key.fill',
        },
      },
      {
        actionKey: AddressMenuAction.Notifications,
        actionTitle: 'Notification Settings',
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'bell.fill',
        },
      },
      {
        actionKey: AddressMenuAction.Remove,
        actionTitle: 'Remove Wallet',
        destructive: true,
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'trash.fill',
        },
      },
    ] satisfies MenuItem<AddressMenuAction>[];

    if (!notificationsEnabled) {
      menuItems = menuItems.filter(item => item.actionKey !== AddressMenuAction.Notifications);
    }

    return {
      menuItems,
    };
  }, [notificationsEnabled]);

  const onPressMenuItem = useCallback(
    (actionKey: AddressMenuAction, { address }: AddressMenuActionData) => {
      const wallet = walletsByAddress[address];
      if (!wallet) {
        logger.error(new RainbowError('[ChangeWalletSheet]: No wallet for address found when pressing menu item'), {
          // TODO: make sure this is okay to log
          address,
          actionKey,
        });
        // TODO: show user facing error
        return;
      }
      switch (actionKey) {
        case AddressMenuAction.Edit:
          onPressEdit(wallet.id, address);
          break;
        case AddressMenuAction.Notifications:
          onPressNotifications(wallet.name, address);
          break;
        case AddressMenuAction.Remove:
          onPressRemove(wallet.id, address);
          break;
        case AddressMenuAction.Settings:
          // onPressSettings(address);
          break;
        case AddressMenuAction.Copy:
          // onPressCopy(address);
          break;
      }
    },
    [walletsByAddress, onPressEdit, onPressNotifications, onPressRemove]
  );

  return (
    <>
      <Box
        style={[
          {
            bottom: PANEL_BOTTOM_OFFSET,
            alignItems: 'center',
            width: '100%',
            pointerEvents: 'box-none',
            position: 'absolute',
            zIndex: 30000,
          },
        ]}
      >
        <Panel>
          <Box style={{ maxHeight: MAX_PANEL_HEIGHT }}>
            <SheetHandleFixedToTop />
            <Box paddingTop="32px" paddingBottom="12px" width="full" justifyContent="center" alignItems="center">
              <Text align="center" color="label" size="20pt" weight="heavy">
                {'Wallets'}
              </Text>
              {/* TODO: this positioning is jank */}
              <Box position="absolute" style={{ right: 24, top: 32 + 3 }}>
                <ButtonPressAnimation onPress={onPressEditMode}>
                  <Text color="blue" size="17pt" weight="medium">
                    {editMode ? i18n.t(i18n.l.button.done) : i18n.t(i18n.l.button.edit)}
                  </Text>
                </ButtonPressAnimation>
              </Box>
            </Box>
            {/* TODO: why is this here? */}
            {IS_ANDROID && <Whitespace />}
            <WalletList
              walletItems={allWalletItems}
              onPressMenuItem={onPressMenuItem}
              menuItems={addressMenuConfig.menuItems}
              editMode={editMode}
              onPressAccount={onPressAccount}
            />
          </Box>
          <Box height={{ custom: FOOTER_HEIGHT }} position="absolute" bottom="0px" width="full">
            {/* TODO: progressive blurview on iOS */}
            <EasingGradient
              endColor={'#191A1C'}
              endOpacity={1}
              startColor={'#191A1C'}
              startOpacity={0}
              style={{ height: '100%', position: 'absolute', width: '100%' }}
            />
            <Box
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
              paddingHorizontal="20px"
              paddingBottom="20px"
              paddingTop="24px"
            >
              {!editMode ? (
                <Stack space="10px">
                  <Text color="label" size="13pt" weight="medium">
                    {'Total Balance'}
                  </Text>
                  <Text color="label" size="17pt" weight="heavy">
                    {ownedWalletsTotalBalance}
                  </Text>
                </Stack>
              ) : null}
              <ButtonPressAnimation onPress={onPressAddAnotherWallet}>
                <Box
                  background="blue"
                  justifyContent="center"
                  alignItems="center"
                  height={{ custom: 44 }}
                  paddingHorizontal="16px"
                  borderRadius={22}
                  borderWidth={1}
                  borderColor={{ custom: colors.alpha(colors.appleBlue, 0.06) }}
                >
                  <Text color="label" size="17pt" weight="heavy">
                    {'􀅼 Add'}
                  </Text>
                </Box>
              </ButtonPressAnimation>
            </Box>
          </Box>
        </Panel>
      </Box>
      <TapToDismiss />
    </>
  );
}
