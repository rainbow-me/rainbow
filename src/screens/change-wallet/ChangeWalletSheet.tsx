import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, type LayoutChangeEvent } from 'react-native';

import Clipboard from '@react-native-clipboard/clipboard';
import { useRoute, type RouteProp } from '@react-navigation/native';
import ConditionalWrap from 'conditional-wrap';
import { triggerHaptics } from 'react-native-turbo-haptics';
import type { Address } from 'viem';

import { analytics } from '@/analytics';
import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { BlurGradient } from '@/components/blur/BlurGradient';
import { type MenuConfig, type MenuItem } from '@/components/DropdownMenu';
import { SheetHandleFixedToTop } from '@/components/sheet';
import { Panel, PANEL_WIDTH } from '@/components/SmoothPager/ListPanel';
import { TapToDismiss } from '@/components/TapToDismiss';
import { FeatureHintTooltip, type TooltipRef } from '@/components/tooltips/FeatureHintTooltip';
import { Box, globalColors, HitSlop, Inline, Text } from '@/design-system';
import type { EthereumAddress } from '@/entities/wallet';
import { NOTIFICATIONS } from '@/features/config/constants/experimental';
import { useExperimentalFlag } from '@/features/config/hooks/experimentalHooks';
import { type RainbowWallet } from '@/features/wallet/types';
import { showActionSheetWithOptions } from '@/framework/ui/utils/actionsheet';
import { ensureValidHex, isValidHex } from '@/handlers/web3';
import WalletTypes from '@/helpers/walletTypes';
import { updateWebProfile } from '@/helpers/webData';
import { useLiveWalletBalance } from '@/hooks/useLiveWalletBalance';
import { useWalletTransactionCounts } from '@/hooks/useWalletTransactionCounts';
import * as i18n from '@/languages';
import { logger, RainbowError } from '@/logger';
import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { type RootStackParamList } from '@/navigation/types';
import { getNotificationSettingsForWalletWithAddress } from '@/notifications/settings/storage';
import { WalletList } from '@/screens/change-wallet/components/WalletList';
import { FOOTER_HEIGHT, MAX_PANEL_HEIGHT, PANEL_HEADER_HEIGHT, PANEL_INSET_HORIZONTAL } from '@/screens/change-wallet/layout';
import { AddressMenuAction, type AddressItem, type AddressMenuActionData } from '@/screens/change-wallet/model';
import { SettingsPages } from '@/screens/SettingsSheet/SettingsPages';
import { MAX_PINNED_ADDRESSES, usePinnedWalletsStore } from '@/state/wallets/pinnedWalletsStore';
import { switchWallet } from '@/state/wallets/switchWallet';
import { useWalletsWithBalancesAndNames } from '@/state/wallets/useWalletsWithBalancesAndNames';
import { getAccountProfileInfo, updateAccountInfo, useAccountAddress, useWallets, useWalletsStore } from '@/state/wallets/walletsStore';
import { useTheme } from '@/theme/ThemeContext';
import safeAreaInsetValues from '@/utils/safeAreaInsetValues';

const PANEL_BOTTOM_OFFSET = Math.max(safeAreaInsetValues.bottom + 5, Platform.OS === 'ios' ? 8 : 30);

const RowTypes = {
  ADDRESS: 1,
  EMPTY: 2,
};

export function ChangeWalletSheet() {
  const { params = {} } = useRoute<RouteProp<RootStackParamList, typeof Routes.CHANGE_WALLET_SHEET>>();

  const { onChangeWallet, watchOnly = false, hideReadOnlyWallets = false } = params;
  const accountAddress = useAccountAddress();
  const wallets = useWallets();
  const notificationsEnabled = useExperimentalFlag(NOTIFICATIONS);

  const { colors, isDarkMode } = useTheme();
  const { goBack, navigate, replace } = useNavigation();
  const walletsWithBalancesAndNames = useWalletsWithBalancesAndNames();
  const liveWalletBalance = useLiveWalletBalance();

  const initialHasShownEditHintTooltip = useMemo(() => usePinnedWalletsStore.getState().hasShownEditHintTooltip, []);
  const initialPinnedAddressCount = useMemo(() => usePinnedWalletsStore.getState().pinnedAddresses.length, []);
  const { transactionCounts, isLoading: isLoadingTransactionCounts } = useWalletTransactionCounts();
  const hasAutoPinnedAddresses = usePinnedWalletsStore(state => state.hasAutoPinnedAddresses);

  const featureHintTooltipRef = useRef<TooltipRef>(null);

  const [editMode, setEditMode] = useState(false);
  const [isLayoutMeasured, setIsLayoutMeasured] = useState(Platform.OS === 'ios');

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
        (wallet.addresses || []).forEach(account => {
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

    Object.values(walletsWithBalancesAndNames || {}).forEach(wallet => {
      const visibleAccounts = (wallet.addresses || []).filter(account => account.visible);

      visibleAccounts.forEach(account => {
        const isSelectedAddress = account.address === accountAddress;
        const balanceText = account.balancesMinusHiddenBalances
          ? account.balancesMinusHiddenBalances
          : i18n.t(i18n.l.wallet.change_wallet.loading_balance);

        const item: AddressItem = {
          id: account.address,
          address: account.address,
          image: account.image,
          color: account.color,
          emoji: account.emoji,
          label: account.label,
          balance: isSelectedAddress && liveWalletBalance ? liveWalletBalance : balanceText,
          isLedger: wallet.type === WalletTypes.bluetooth,
          isReadOnly: wallet.type === WalletTypes.readOnly,
          isSelected: account.address === accountAddress,
          rowType: RowTypes.ADDRESS,
          walletId: wallet.id,
        };

        if ([WalletTypes.mnemonic, WalletTypes.seed, WalletTypes.privateKey].includes(wallet.type)) {
          sortedWallets.push(item);
        } else if (wallet.type === WalletTypes.bluetooth) {
          bluetoothWallets.push(item);
        } else if (wallet.type === WalletTypes.readOnly && !hideReadOnlyWallets) {
          readOnlyWallets.push(item);
        }
      });
    });

    // sorts by order wallets were added
    return [...sortedWallets, ...bluetoothWallets, ...readOnlyWallets].sort((a, b) => a.walletId.localeCompare(b.walletId));
  }, [walletsWithBalancesAndNames, accountAddress, hideReadOnlyWallets, liveWalletBalance]);

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

  const onChangeAccount = useCallback(
    async (walletId: string, address: Address, fromDeletion = false) => {
      if (editMode && !fromDeletion) return;
      const wallet = wallets?.[walletId];
      if (!wallet) return;
      if (watchOnly && onChangeWallet) {
        await switchWallet(address, wallet.id);
        onChangeWallet(address, wallet);
        return;
      }
      if (walletId === useWalletsStore.getState().selectedWalletId && address === accountAddress) return;
      try {
        await switchWallet(address, wallet.id);
        if (!fromDeletion) {
          goBack();
        }
      } catch (e) {
        logger.error(new RainbowError('[ChangeWalletSheet]: Error while switching account', e), {
          error: e,
        });
      }
    },
    [accountAddress, editMode, goBack, onChangeWallet, wallets, watchOnly]
  );

  const renameWallet = useCallback(
    (walletId: string, address: string) => {
      const wallet = wallets?.[walletId];
      if (!wallet) return;
      const account = isValidHex(address) ? getAccountProfileInfo(address) : undefined;

      replace(Routes.MODAL_SCREEN, {
        address,
        asset: [],
        onCloseModal: async props => {
          const { name = '', color: colorProp = null } = props;
          if (!isValidHex(address)) return;

          const color = colorProp || account?.accountColor || 0;

          updateAccountInfo({
            address,
            label: name || undefined,
            walletId,
          });

          if (name) {
            analytics.track(analytics.event.tappedDoneEditingWallet, { wallet_label: name });
            await updateWebProfile(address, name, colors.avatarBackgrounds[color], null);
          } else {
            analytics.track(analytics.event.tappedCancelEditingWallet);
          }
        },
        profile: {
          color: account?.accountColor,
          image: account?.accountImage || ``,
          name: account?.accountName || ``,
        },
        type: 'wallet_profile',
        actionType: 'Switch',
      });
    },
    [colors.avatarBackgrounds, replace, wallets]
  );

  const onPressEdit = useCallback(
    (walletId: string, address: string) => {
      analytics.track(analytics.event.tappedEditWallet);
      void switchWallet(ensureValidHex(address), walletId);
      renameWallet(walletId, address);
    },
    [renameWallet]
  );

  const onPressNotifications = useCallback(
    (walletName: string, address: string) => {
      analytics.track(analytics.event.tappedNotificationSettings);
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
      analytics.track(analytics.event.tappedDeleteWallet);
      // Delete wallet with confirmation
      showActionSheetWithOptions(
        {
          cancelButtonIndex: 1,
          destructiveButtonIndex: 0,
          message: i18n.t(i18n.l.wallet.action.remove_confirm),
          options: [i18n.t(i18n.l.wallet.action.remove), i18n.t(i18n.l.button.cancel)],
        },
        async buttonIndex => {
          if (buttonIndex === 0) {
            analytics.track(analytics.event.tappedDeleteWalletConfirm);
            const previous = useWalletsStore.getState();
            await previous.removeAccount(walletId, ensureValidHex(address));
            const current = useWalletsStore.getState();
            triggerHaptics('notificationSuccess');
            if (!current.getSelectedWallet()) {
              goBack();
              navigate(Routes.WELCOME_SCREEN);
            }
          }
        }
      );
    },
    [goBack, navigate]
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

      navigate(Routes.SETTINGS_SHEET, {
        params: {
          walletId: wallet.id,
        },
        screen: SettingsPages.backup.key,
      });
    },
    [navigate, walletsByAddress]
  );

  const onPressAddAnotherWallet = useCallback(() => {
    analytics.track(analytics.event.pressedButton, {
      buttonName: 'AddAnotherWalletButton',
      action: 'Navigates from WalletList to AddWalletSheet',
    });
    replace(Routes.ADD_WALLET_NAVIGATOR, {
      flowContext: 'in_app',
      isFirstWallet: false,
    });
  }, [replace]);

  const onPressEditMode = useCallback(() => {
    analytics.track(analytics.event.tappedEdit);
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
      onChangeAccount(wallet.id, address as Address);
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

  const navigation = useNavigation();

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (Platform.OS !== 'android') return;
      const { height } = event.nativeEvent.layout;

      // @ts-expect-error Bottom sheet options is not typed
      navigation.setOptions({ snapPoints: [height + PANEL_BOTTOM_OFFSET] });

      // Wait for snap point to be committed before showing
      if (!isLayoutMeasured) {
        // Using 32 ms to give Reanimated 2 frames to commit the snapPoint change before
        // making the sheet visible. This should ensure it's already settled at the correct height when it appears.
        setTimeout(() => {
          setIsLayoutMeasured(true);
        }, 32);
      }
    },
    [navigation, isLayoutMeasured]
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
            opacity: isLayoutMeasured ? 1 : 0,
          },
        ]}
      >
        <Panel>
          <Box onLayout={handleLayout} style={{ maxHeight: MAX_PANEL_HEIGHT, paddingHorizontal: PANEL_INSET_HORIZONTAL }}>
            <Box justifyContent="center" position="absolute" style={{ pointerEvents: 'none', zIndex: 100 }} width={{ custom: PANEL_WIDTH }}>
              <BlurGradient
                color={{ dark: '#191A1C', light: globalColors.white100 }}
                fadeTo="top"
                feather={isDarkMode ? undefined : 5}
                gradientOpacity={{ dark: 1, light: 0.92 }}
                height={PANEL_HEADER_HEIGHT + 16}
                intensity={5}
                style={{ position: 'absolute', top: 0 }}
                width={PANEL_WIDTH}
              />
              <SheetHandleFixedToTop top={8} />
              <Text align="center" color="label" size="20pt" style={{ paddingTop: 30 }} weight="heavy">
                {i18n.t(i18n.l.wallet.change_wallet.wallets)}
              </Text>
            </Box>
            <Box style={{ position: 'relative' }} zIndex={30001} width="full" justifyContent="center" alignItems="center">
              <Box position="absolute" style={{ right: 4, top: 30 + 3 }}>
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
                      <Text color="blue" size="17pt" weight="semibold">
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
          <Box height={{ custom: FOOTER_HEIGHT }} position="absolute" bottom="0px" style={{ pointerEvents: 'box-none' }} width="full">
            <BlurGradient
              color={{ dark: '#191A1C', light: globalColors.white100 }}
              fadeTo="bottom"
              feather={isDarkMode ? undefined : 5}
              gradientOpacity={{ dark: 1, light: 0.92 }}
              height={FOOTER_HEIGHT}
              intensity={5}
              style={{ position: 'absolute' }}
              width={PANEL_WIDTH}
            />
            <Box
              flexDirection="row"
              justifyContent="flex-end"
              alignItems="center"
              paddingHorizontal={{ custom: PANEL_INSET_HORIZONTAL }}
              style={{ bottom: 20, right: 0, pointerEvents: 'box-none', position: 'absolute' }}
            >
              <ButtonPressAnimation onPress={onPressAddAnotherWallet} testID="add-another-wallet-button">
                <Box
                  background="blue"
                  justifyContent="center"
                  alignItems="center"
                  height={{ custom: 44 }}
                  paddingLeft={{ custom: 14 }}
                  paddingRight="16px"
                  borderRadius={22}
                  shadow={isDarkMode ? undefined : '30px blue'}
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
