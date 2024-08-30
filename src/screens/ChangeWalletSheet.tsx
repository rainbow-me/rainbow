import { useRoute } from '@react-navigation/native';
import lang from 'i18n-js';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, InteractionManager, View } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useDispatch } from 'react-redux';
import Divider from '../components/Divider';
import { ButtonPressAnimation } from '../components/animations';
import WalletList from '../components/change-wallet/WalletList';
import { Centered, Column, Row } from '../components/layout';
import { Sheet, SheetTitle } from '../components/sheet';
import { Text } from '../components/text';
import { removeWalletData } from '../handlers/localstorage/removeWallet';
import { cleanUpWalletKeys } from '../model/wallet';
import { useNavigation } from '../navigation/Navigation';
import { addressSetSelected, walletsSetSelected, walletsUpdate } from '../redux/wallets';
import { analytics, analyticsV2 } from '@/analytics';
import { getExperimetalFlag, HARDWARE_WALLETS } from '@/config';
import { useAccountSettings, useInitializeWallet, useWallets, useWalletsWithBalancesAndNames, useWebData } from '@/hooks';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { doesWalletsContainAddress, showActionSheetWithOptions } from '@/utils';
import logger from '@/utils/logger';
import { useTheme } from '@/theme';
import { EthereumAddress } from '@/entities';
import { getNotificationSettingsForWalletWithAddress } from '@/notifications/settings/storage';
import { useRunChecks } from '@/components/remote-promo-sheet/runChecks';
import { DEVICE_HEIGHT } from '@/utils/deviceUtils';
import { IS_ANDROID, IS_IOS } from '@/env';

const FOOTER_HEIGHT = getExperimetalFlag(HARDWARE_WALLETS) ? 100 : 60;
const LIST_PADDING_BOTTOM = 6;
const MAX_LIST_HEIGHT = DEVICE_HEIGHT - 220;
const WALLET_ROW_HEIGHT = 59;
const WATCH_ONLY_BOTTOM_PADDING = IS_ANDROID ? 20 : 0;

const EditButton = styled(ButtonPressAnimation).attrs(({ editMode }: { editMode: boolean }) => ({
  scaleTo: 0.96,
  wrapperStyle: {
    width: editMode ? 70 : 58,
  },
  width: editMode ? 100 : 100,
}))(
  IS_IOS
    ? {
        position: 'absolute',
        right: 20,
        top: -11,
      }
    : {
        elevation: 10,
        position: 'relative',
        right: 20,
        top: 6,
      }
);

const EditButtonLabel = styled(Text).attrs(({ theme: { colors }, editMode }: { theme: any; editMode: boolean }) => ({
  align: 'right',
  color: colors.appleBlue,
  letterSpacing: 'roundedMedium',
  size: 'large',
  weight: editMode ? 'bold' : 'semibold',
  numberOfLines: 1,
  ellipsizeMode: 'tail',
}))({
  height: 40,
});

const Whitespace = styled(View)({
  backgroundColor: ({ theme: { colors } }: any) => colors.white,
  bottom: -398,
  height: 400,
  position: 'absolute',
  width: '100%',
});

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

export type EditWalletContextMenuActions = {
  edit: (walletId: string, address: EthereumAddress) => void;
  notifications: (walletName: string, address: EthereumAddress) => void;
  remove: (walletId: string, address: EthereumAddress) => void;
};

export default function ChangeWalletSheet() {
  const { params = {} as any } = useRoute();
  const { onChangeWallet, watchOnly = false, currentAccountAddress } = params;
  const { selectedWallet, wallets } = useWallets();
  const { runChecks } = useRunChecks(false);

  const { colors } = useTheme();
  const { updateWebProfile } = useWebData();
  const { accountAddress } = useAccountSettings();
  const { goBack, navigate } = useNavigation();
  const dispatch = useDispatch();
  const initializeWallet = useInitializeWallet();
  const walletsWithBalancesAndNames = useWalletsWithBalancesAndNames();

  const [editMode, setEditMode] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(currentAccountAddress || accountAddress);
  const [currentSelectedWallet, setCurrentSelectedWallet] = useState(selectedWallet);

  const [headerHeight, listHeight, scrollEnabled, showDividers] = useMemo(() => {
    const { listHeight, scrollEnabled } = getWalletListHeight(wallets, watchOnly);

    const headerHeight = scrollEnabled ? 40 : 30;
    const showDividers = scrollEnabled;

    return [headerHeight, listHeight, scrollEnabled, showDividers];
  }, [wallets, watchOnly]);

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
        // @ts-expect-error initializeWallet is not typed correctly
        initializeWallet(null, null, null, false, false, null, true);
        if (!fromDeletion) {
          goBack();
          setTimeout(runChecks, 10_000);
        }
      } catch (e) {
        logger.log('error while switching account', e);
      }
    },
    [currentAddress, dispatch, editMode, goBack, initializeWallet, onChangeWallet, runChecks, wallets, watchOnly]
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
          addresses: (currentWallet.addresses ?? []).map(account =>
            account.address.toLowerCase() === address.toLowerCase() ? { ...account, visible: false } : account
          ),
        },
      };
      // If there are no visible wallets
      // then delete the wallet
      const visibleAddresses = (newWallets as any)[walletId].addresses.filter((account: any) => account.visible);
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
      const account = wallet.addresses.find(account => account.address === address);

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
        Alert.alert(lang.t('wallet.action.notifications.alert_title'), lang.t('wallet.action.notifications.alert_message'), [
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
          message: lang.t('wallet.action.remove_confirm'),
          options: [lang.t('wallet.action.remove'), lang.t('button.cancel')],
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

  const onPressPairHardwareWallet = useCallback(() => {
    analyticsV2.track(analyticsV2.event.addWalletFlowStarted, {
      isFirstWallet: false,
      type: 'ledger_nano_x',
    });
    goBack();
    InteractionManager.runAfterInteractions(() => {
      navigate(Routes.PAIR_HARDWARE_WALLET_NAVIGATOR, {
        entryPoint: Routes.CHANGE_WALLET_SHEET,
        isFirstWallet: false,
      });
    });
  }, [goBack, navigate]);

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

  return (
    <Sheet borderRadius={30}>
      {IS_ANDROID && <Whitespace />}
      <Column height={headerHeight} justify="space-between">
        <Centered>
          <SheetTitle testID="change-wallet-sheet-title">{lang.t('wallet.label')}</SheetTitle>

          {!watchOnly && (
            <Row style={{ position: 'absolute', right: 0 }}>
              <EditButton editMode={editMode} onPress={onPressEditMode}>
                <EditButtonLabel editMode={editMode}>{editMode ? lang.t('button.done') : lang.t('button.edit')}</EditButtonLabel>
              </EditButton>
            </Row>
          )}
        </Centered>
        {showDividers && (
          // @ts-expect-error JS component
          <Divider color={colors.rowDividerExtraLight} inset={[0, 15]} />
        )}
      </Column>
      <WalletList
        accountAddress={currentAddress}
        allWallets={walletsWithBalancesAndNames}
        contextMenuActions={
          {
            edit: onPressEdit,
            notifications: onPressNotifications,
            remove: onPressRemove,
          } as EditWalletContextMenuActions
        }
        currentWallet={currentSelectedWallet}
        editMode={editMode}
        height={listHeight}
        onChangeAccount={onChangeAccount}
        onPressAddAnotherWallet={onPressAddAnotherWallet}
        onPressPairHardwareWallet={onPressPairHardwareWallet}
        scrollEnabled={scrollEnabled}
        showDividers={showDividers}
        watchOnly={watchOnly}
      />
    </Sheet>
  );
}
