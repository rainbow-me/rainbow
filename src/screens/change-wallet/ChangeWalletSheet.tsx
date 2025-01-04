import { RouteProp, useRoute } from '@react-navigation/native';
import * as i18n from '@/languages';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, InteractionManager } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useDispatch } from 'react-redux';
import { ButtonPressAnimation } from '@/components/animations';
import { WalletList } from '@/screens/change-wallet/components/WalletList';
import { removeWalletData } from '@/handlers/localstorage/removeWallet';
import { cleanUpWalletKeys, RainbowWallet } from '@/model/wallet';
import { useNavigation } from '@/navigation/Navigation';
import { addressSetSelected, walletsSetSelected, walletsUpdate } from '@/redux/wallets';
import WalletTypes from '@/helpers/walletTypes';
import { analytics, analyticsV2 } from '@/analytics';
import { useAccountSettings, useInitializeWallet, useWallets, useWalletsWithBalancesAndNames, useWebData } from '@/hooks';
import Routes from '@/navigation/routesNames';
import { doesWalletsContainAddress, safeAreaInsetValues, showActionSheetWithOptions } from '@/utils';
import { logger, RainbowError } from '@/logger';
import { useTheme } from '@/theme';
import { EthereumAddress } from '@/entities';
import { getNotificationSettingsForWalletWithAddress } from '@/notifications/settings/storage';
import { IS_IOS } from '@/env';
import { remotePromoSheetsStore } from '@/state/remotePromoSheets/remotePromoSheets';
import { RootStackParamList } from '@/navigation/types';
import { Box, globalColors, HitSlop, Inline, Stack, Text } from '@/design-system';
import { addDisplay } from '@/helpers/utilities';
import { Panel, TapToDismiss } from '@/components/SmoothPager/ListPanel';
import { SheetHandleFixedToTop } from '@/components/sheet';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { MenuConfig, MenuItem } from '@/components/DropdownMenu';
import { NOTIFICATIONS, useExperimentalFlag } from '@/config';
import { FeatureHintTooltip, TooltipRef } from '@/components/tooltips/FeatureHintTooltip';
import { MAX_PINNED_ADDRESSES, usePinnedWalletsStore } from '@/state/wallets/pinnedWalletsStore';
import ConditionalWrap from 'conditional-wrap';
import Clipboard from '@react-native-clipboard/clipboard';
import { SettingsPages } from '@/screens/SettingsSheet/SettingsPages';
import { useWalletTransactionCounts } from '@/hooks/useWalletTransactionCounts';
import { DEVICE_HEIGHT } from '@/utils/deviceUtils';

const PANEL_BOTTOM_OFFSET = Math.max(safeAreaInsetValues.bottom + 5, IS_IOS ? 8 : 30);

export const PANEL_INSET_HORIZONTAL = 20;
export const MAX_PANEL_HEIGHT = Math.min(690, DEVICE_HEIGHT - 100);
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

export interface AddressItem {
  id: EthereumAddress;
  address: EthereumAddress;
  color: number;
  isReadOnly: boolean;
  isLedger: boolean;
  isSelected: boolean;
  label: string;
  rowType: number;
  walletId: string;
  balance: string;
  image: string | null | undefined;
}

export default function ChangeWalletSheet() {
  const { params = {} } = useRoute<RouteProp<RootStackParamList, 'ChangeWalletSheet'>>();

  const { onChangeWallet, watchOnly = false, currentAccountAddress } = params;
  const { selectedWallet, wallets } = useWallets();
  const notificationsEnabled = useExperimentalFlag(NOTIFICATIONS);

  const { colors, isDarkMode } = useTheme();
  const { updateWebProfile } = useWebData();
  const { accountAddress } = useAccountSettings();
  const { goBack, navigate } = useNavigation();
  const dispatch = useDispatch();
  const initializeWallet = useInitializeWallet();
  const walletsWithBalancesAndNames = useWalletsWithBalancesAndNames();

  const initialHasShownEditHintTooltip = useMemo(() => usePinnedWalletsStore.getState().hasShownEditHintTooltip, []);
  const initialPinnedAddressCount = useMemo(() => usePinnedWalletsStore.getState().pinnedAddresses.length, []);
  const { transactionCounts, isLoading: isLoadingTransactionCounts } = useWalletTransactionCounts(wallets || {});
  const hasAutoPinnedAddresses = usePinnedWalletsStore(state => state.hasAutoPinnedAddresses);

  const featureHintTooltipRef = useRef<TooltipRef>(null);

  const [editMode, setEditMode] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(currentAccountAddress || accountAddress);
  const [currentSelectedWallet, setCurrentSelectedWallet] = useState(selectedWallet);

  const setPinnedAddresses = usePinnedWalletsStore(state => state.setPinnedAddresses);

  // Feature hint tooltip should only ever been shown once.
  useEffect(() => {
    if (!initialHasShownEditHintTooltip) {
      usePinnedWalletsStore.setState({ hasShownEditHintTooltip: true });
    }
  }, [initialHasShownEditHintTooltip]);

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
          label: account.label,
          balance: balanceText,
          isLedger: wallet.type === WalletTypes.bluetooth,
          isReadOnly: wallet.type === WalletTypes.readOnly,
          isSelected: account.address === currentAddress,
          rowType: RowTypes.ADDRESS,
          walletId: wallet.id,
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
  }, [walletsWithBalancesAndNames, currentAddress]);

  // If user has never seen pinned addresses feature, auto-pin the users most used owned addresses
  useEffect(() => {
    if (hasAutoPinnedAddresses || initialPinnedAddressCount > 0 || isLoadingTransactionCounts) return;

    const pinnableAddresses = allWalletItems.filter(item => !item.isReadOnly).map(item => item.address);

    // Do not auto-pin if user only has read-only wallets
    if (pinnableAddresses.length === 0) return;

    const addressesToAutoPin = pinnableAddresses
      .sort((a, b) => transactionCounts[b.toLowerCase()] - transactionCounts[a.toLowerCase()])
      .slice(0, MAX_PINNED_ADDRESSES);

    setPinnedAddresses(addressesToAutoPin);
  }, [
    allWalletItems,
    setPinnedAddresses,
    hasAutoPinnedAddresses,
    initialPinnedAddressCount,
    transactionCounts,
    isLoadingTransactionCounts,
  ]);

  const ownedWalletsTotalBalance = useMemo(() => {
    let isLoadingBalance = false;
    let hasOwnedWallets = false;

    // We have to explicitly handle the null case because the addDisplay function expects the currency symbol, and we cannot assume the position of the currency symbol
    const totalBalance: string | null = Object.values(walletsWithBalancesAndNames).reduce(
      (acc, wallet) => {
        // only include owned wallet balances
        if (wallet.type === WalletTypes.readOnly) return acc;

        hasOwnedWallets = true;
        const visibleAccounts = wallet.addresses.filter(account => account.visible);
        let walletTotalBalance: string | null = null;

        visibleAccounts.forEach(account => {
          if (!account.balancesMinusHiddenBalances) {
            isLoadingBalance = true;
            return;
          }
          if (walletTotalBalance === null) {
            walletTotalBalance = account.balancesMinusHiddenBalances;
            return;
          }

          walletTotalBalance = addDisplay(walletTotalBalance, account.balancesMinusHiddenBalances);
        });

        if (acc === null) {
          return walletTotalBalance;
        }
        if (walletTotalBalance === null) {
          return acc;
        }

        return addDisplay(acc, walletTotalBalance);
      },
      null as string | null
    );

    // If user has no owned wallets, return null so we can conditionally hide the balance
    if (!hasOwnedWallets) return null;

    if (isLoadingBalance) return i18n.t(i18n.l.wallet.change_wallet.loading_balance);

    if (totalBalance === null) return null;

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

  const onPressCopyAddress = useCallback((address: string) => {
    Clipboard.setString(address);
  }, []);

  const onPressWalletSettings = useCallback(
    (address: string) => {
      const wallet = walletsByAddress[address];

      if (!wallet) {
        logger.error(new RainbowError('[ChangeWalletSheet]: No wallet for address found when pressing wallet settings'), {
          address,
        });
        return;
      }

      InteractionManager.runAfterInteractions(() => {
        navigate(Routes.SETTINGS_SHEET, {
          params: {
            walletId: wallet.id,
            initialRoute: SettingsPages.backup,
          },
          screen: SettingsPages.backup.key,
        });
      });
    },
    [navigate, walletsByAddress]
  );

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
    if (featureHintTooltipRef.current) {
      featureHintTooltipRef.current.dismiss();
    }
    setEditMode(e => !e);
  }, [featureHintTooltipRef]);

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
        actionTitle: i18n.t(i18n.l.wallet.change_wallet.address_menu.edit),
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'pencil',
        },
      },
      {
        actionKey: AddressMenuAction.Copy,
        actionTitle: i18n.t(i18n.l.wallet.change_wallet.address_menu.copy),
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'doc.fill',
        },
      },
      {
        actionKey: AddressMenuAction.Settings,
        actionTitle: i18n.t(i18n.l.wallet.change_wallet.address_menu.settings),
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'key.fill',
        },
      },
      {
        actionKey: AddressMenuAction.Notifications,
        actionTitle: i18n.t(i18n.l.wallet.change_wallet.address_menu.notifications),
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'bell.fill',
        },
      },
      {
        actionKey: AddressMenuAction.Remove,
        actionTitle: i18n.t(i18n.l.wallet.change_wallet.address_menu.remove),
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
          actionKey,
        });
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
          onPressWalletSettings(address);
          break;
        case AddressMenuAction.Copy:
          onPressCopyAddress(address);
          break;
      }
    },
    [walletsByAddress, onPressEdit, onPressNotifications, onPressRemove, onPressCopyAddress, onPressWalletSettings]
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
          <Box style={{ maxHeight: MAX_PANEL_HEIGHT, paddingHorizontal: PANEL_INSET_HORIZONTAL }}>
            <SheetHandleFixedToTop />
            <Box
              style={{ position: 'relative' }}
              zIndex={30001}
              paddingTop="32px"
              paddingBottom="12px"
              width="full"
              justifyContent="center"
              alignItems="center"
            >
              <Text align="center" color="label" size="20pt" weight="heavy">
                {i18n.t(i18n.l.wallet.change_wallet.wallets)}
              </Text>
              {/* +3 to account for font size difference */}
              <Box position="absolute" style={{ right: 4, top: 32 + 3 }}>
                <ConditionalWrap
                  condition={!initialHasShownEditHintTooltip}
                  wrap={children => (
                    <FeatureHintTooltip
                      ref={featureHintTooltipRef}
                      side="bottom"
                      align="end"
                      alignOffset={18}
                      sideOffset={12}
                      title={i18n.t(i18n.l.wallet.change_wallet.edit_hint_tooltip.title)}
                      SubtitleComponent={
                        <Inline>
                          <Text color={{ custom: globalColors.grey60 }} size="13pt" weight="semibold">
                            {i18n.t(i18n.l.wallet.change_wallet.edit_hint_tooltip.subtitle.prefix)}
                          </Text>
                          <Text color="blue" size="13pt" weight="semibold">
                            {` ${i18n.t(i18n.l.wallet.change_wallet.edit_hint_tooltip.subtitle.action)} `}
                          </Text>
                          <Text color={{ custom: globalColors.grey60 }} size="13pt" weight="semibold">
                            {i18n.t(i18n.l.wallet.change_wallet.edit_hint_tooltip.subtitle.suffix)}
                          </Text>
                        </Inline>
                      }
                    >
                      {children}
                    </FeatureHintTooltip>
                  )}
                >
                  <ButtonPressAnimation onPress={onPressEditMode}>
                    <HitSlop horizontal={'32px'} vertical={'12px'}>
                      <Text color="blue" size="17pt" weight="medium">
                        {editMode ? i18n.t(i18n.l.button.done) : i18n.t(i18n.l.button.edit)}
                      </Text>
                    </HitSlop>
                  </ButtonPressAnimation>
                </ConditionalWrap>
              </Box>
            </Box>
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
            {/* {IS_IOS ? (
              <BlurView
                style={{ height: '100%', position: 'absolute', width: '100%' }}
                blurType="dark"
                blurAmount={10}
                reducedTransparencyFallbackColor="white"
              />
            ) : (
              <EasingGradient
                endColor={isDarkMode ? '#191A1C' : '#F5F5F5'}
                endOpacity={1}
                startColor={isDarkMode ? '#191A1C' : '#F5F5F5'}
                startOpacity={0}
                style={{ height: '100%', position: 'absolute', width: '100%' }}
              />
            )} */}
            <EasingGradient
              endColor={isDarkMode ? '#191A1C' : '#F5F5F5'}
              endOpacity={1}
              startColor={isDarkMode ? '#191A1C' : '#F5F5F5'}
              startOpacity={0}
              style={{ height: '100%', position: 'absolute', width: '100%' }}
            />
            <Box
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
              paddingHorizontal={{ custom: PANEL_INSET_HORIZONTAL }}
              paddingTop="24px"
            >
              {/* TODO: enable when blurview is implemented */}
              {/* {!editMode && ownedWalletsTotalBalance ? (
                <Stack space="10px">
                  <Text color="labelSecondary" size="13pt" weight="bold">
                    {i18n.t(i18n.l.wallet.change_wallet.total_balance)}
                  </Text>
                  <Text color="label" size="17pt" weight="bold">
                    {ownedWalletsTotalBalance}
                  </Text>
                </Stack>
              ) : (
                <Box />
              )} */}
              <Box />
              <ButtonPressAnimation onPress={onPressAddAnotherWallet} testID="add-another-wallet-button">
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
                    {`􀅼 ${i18n.t(i18n.l.button.add)}`}
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
