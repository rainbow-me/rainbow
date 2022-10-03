import { IS_TESTING } from 'react-native-dotenv';
import { useRoute } from '@react-navigation/core';
import { captureException } from '@sentry/react-native';
import lang from 'i18n-js';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { InteractionManager } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useDispatch } from 'react-redux';
import Divider from '../components/Divider';
import { ButtonPressAnimation } from '../components/animations';
import WalletList from '../components/change-wallet/WalletList';
import { Centered, Column, Row } from '../components/layout';
import { Sheet, SheetTitle } from '../components/sheet';
import { Text } from '../components/text';
import { backupUserDataIntoCloud } from '../handlers/cloudBackup';
import { removeWalletData } from '../handlers/localstorage/removeWallet';
import showWalletErrorAlert from '../helpers/support';
import { WalletLoadingStates } from '../helpers/walletLoadingStates';
import WalletTypes from '../helpers/walletTypes';
import { cleanUpWalletKeys, createWallet } from '../model/wallet';
import { useNavigation } from '../navigation/Navigation';
import {
  addressSetSelected,
  createAccountForWallet,
  walletsLoadState,
  walletsSetSelected,
  walletsUpdate,
} from '../redux/wallets';
import { analytics } from '@/analytics';
import {
  getExperimetalFlag,
  HARDWARE_WALLETS,
  PROFILES,
  useExperimentalFlag,
} from '@/config';
import WalletBackupTypes from '@/helpers/walletBackupTypes';
import { runCampaignChecks } from '@/campaigns/campaignChecks';
import {
  useAccountSettings,
  useInitializeWallet,
  useWallets,
  useWalletsWithBalancesAndNames,
  useWebData,
} from '@/hooks';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import {
  deviceUtils,
  doesWalletsContainAddress,
  showActionSheetWithOptions,
} from '@/utils';
import logger from '@/utils/logger';
import { useTheme } from '@/theme';
import { EthereumAddress } from '@/entities';

const deviceHeight = deviceUtils.dimensions.height;
const footerHeight = getExperimetalFlag(HARDWARE_WALLETS) ? 164 : 111;
const listPaddingBottom = 6;
const walletRowHeight = 59;
const maxListHeight = deviceHeight - 220;

const EditButton = styled(ButtonPressAnimation).attrs(
  ({ editMode }: { editMode: boolean }) => ({
    scaleTo: 0.96,
    wrapperStyle: {
      width: editMode ? 70 : 58,
    },
  })
)(
  ios
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

const EditButtonLabel = styled(Text).attrs(
  ({ theme: { colors }, editMode }: { theme: any; editMode: boolean }) => ({
    align: 'right',
    color: colors.appleBlue,
    letterSpacing: 'roundedMedium',
    size: 'large',
    weight: editMode ? 'bold' : 'semibold',
  })
)({
  height: 40,
});

// @ts-ignore
const Whitespace = styled.View({
  backgroundColor: ({ theme: { colors } }: any) => colors.white,
  bottom: -398,
  height: 400,
  position: 'absolute',
  width: '100%',
});

const getWalletRowCount = (wallets: any) => {
  let count = 0;
  if (wallets) {
    Object.keys(wallets).forEach(key => {
      // Addresses
      count += wallets[key].addresses.filter((account: any) => account.visible)
        .length;
    });
  }
  return count;
};

export type EditWalletContextMenuActions = {
  edit: (walletId: string, address: EthereumAddress) => void;
  notifications: (walletName: string, address: EthereumAddress) => void;
  remove: (walletId: string, address: EthereumAddress) => void;
};

export default function ChangeWalletSheet() {
  const { params = {} as any } = useRoute();
  const { onChangeWallet, watchOnly = false, currentAccountAddress } = params;
  const {
    isDamaged,
    selectedWallet,
    setIsWalletLoading,
    wallets,
  } = useWallets();

  const { colors } = useTheme();
  const { updateWebProfile } = useWebData();
  const { accountAddress } = useAccountSettings();
  const { goBack, navigate } = useNavigation();
  const dispatch = useDispatch();
  const initializeWallet = useInitializeWallet();
  const walletsWithBalancesAndNames = useWalletsWithBalancesAndNames();
  const creatingWallet = useRef<boolean>();
  const profilesEnabled = useExperimentalFlag(PROFILES);

  const [editMode, setEditMode] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(
    currentAccountAddress || accountAddress
  );
  const [currentSelectedWallet, setCurrentSelectedWallet] = useState(
    selectedWallet
  );

  const walletRowCount = useMemo(() => getWalletRowCount(wallets), [wallets]);

  let headerHeight = 30;
  let listHeight =
    walletRowHeight * walletRowCount +
    (!watchOnly ? footerHeight + listPaddingBottom : android ? 20 : 0);
  let scrollEnabled = false;
  let showDividers = false;
  if (listHeight > maxListHeight) {
    headerHeight = 40;
    listHeight = maxListHeight;
    scrollEnabled = true;
    showDividers = true;
  }

  const onChangeAccount = useCallback(
    async (walletId, address, fromDeletion = false) => {
      if (editMode && !fromDeletion) return;
      const wallet = wallets?.[walletId];
      if (!wallet) return;
      if (watchOnly) {
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
        // @ts-ignore
        initializeWallet(null, null, null, false, false, null, true);
        if (!fromDeletion) {
          goBack();

          if (IS_TESTING !== 'true') {
            InteractionManager.runAfterInteractions(() => {
              setTimeout(async () => {
                await runCampaignChecks();
              }, 5000);
            });
          }
        }
      } catch (e) {
        logger.log('error while switching account', e);
      }
    },
    [
      currentAddress,
      dispatch,
      editMode,
      goBack,
      initializeWallet,
      onChangeWallet,
      wallets,
      watchOnly,
    ]
  );

  const deleteWallet = useCallback(
    async (walletId, address) => {
      const newWallets = {
        ...wallets,
        [walletId]: {
          ...wallets?.[walletId],
          addresses: wallets?.[walletId].addresses.map(account =>
            account.address.toLowerCase() === address.toLowerCase()
              ? { ...account, visible: false }
              : account
          ),
        },
      };
      // If there are no visible wallets
      // then delete the wallet
      const visibleAddresses = (newWallets as any)[walletId].addresses.filter(
        (account: any) => account.visible
      );
      if (visibleAddresses.length === 0) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete (newWallets as any)[walletId];
        await dispatch(walletsUpdate(newWallets));
      } else {
        await dispatch(walletsUpdate(newWallets));
      }
      removeWalletData(address);
    },
    [dispatch, wallets]
  );

  const renameWallet = useCallback(
    (walletId, address) => {
      const wallet = wallets?.[walletId];
      if (!wallet) return;
      const account = wallet.addresses.find(
        account => account.address === address
      );

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
                  const walletAddressIndex = walletAddresses.findIndex(
                    account => account.address === address
                  );
                  const walletAddress = walletAddresses[walletAddressIndex];

                  const updatedWalletAddress = {
                    ...walletAddress,
                    color: args.color,
                    label: args.name,
                  };
                  const updatedWalletAddresses = [...walletAddresses];
                  updatedWalletAddresses[
                    walletAddressIndex
                  ] = updatedWalletAddress;

                  const updatedWallet = {
                    ...wallets[walletId],
                    addresses: updatedWalletAddresses,
                  };
                  const updatedWallets = {
                    ...wallets,
                    [walletId]: updatedWallet,
                  };

                  if (currentSelectedWallet.id === walletId) {
                    await setCurrentSelectedWallet(updatedWallet);
                    await dispatch(walletsSetSelected(updatedWallet));
                  }

                  updateWebProfile(
                    address,
                    args.name,
                    colors.avatarBackgrounds[args.color]
                  );

                  await dispatch(walletsUpdate(updatedWallets));
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
    [
      wallets,
      goBack,
      navigate,
      dispatch,
      currentSelectedWallet.id,
      updateWebProfile,
      colors.avatarBackgrounds,
    ]
  );

  const onPressEdit = useCallback(
    (walletId, address) => {
      analytics.track('Tapped "Edit Wallet"');
      renameWallet(walletId, address);
    },
    [renameWallet]
  );

  const onPressNotifications = useCallback(
    (walletName, address) => {
      analytics.track('Tapped "Notification Settings"');
      navigate(Routes.SETTINGS_SHEET, {
        params: { address, title: walletName },
        screen: Routes.WALLET_NOTIFICATIONS_SETTINGS,
      });
    },
    [navigate]
  );

  const onPressRemove = useCallback(
    (walletId, address) => {
      analytics.track('Tapped "Delete Wallet"');
      // If there's more than 1 account
      // it's deletable
      let isLastAvailableWallet = false;
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < Object.keys(wallets as any).length; i++) {
        const key = Object.keys(wallets as any)[i];
        const someWallet = wallets?.[key];
        const otherAccount = someWallet?.addresses.find(
          account => account.visible && account.address !== address
        );
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
                if (foundWallet) {
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

  const onPressAddAccount = useCallback(async () => {
    try {
      analytics.track('Tapped "Create a new wallet"');
      if (creatingWallet.current) return;
      creatingWallet.current = true;

      // Show naming modal
      InteractionManager.runAfterInteractions(() => {
        goBack();
      });
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          navigate(Routes.MODAL_SCREEN, {
            actionType: 'Create',
            asset: [],
            isNewProfile: true,
            onCloseModal: async (args: any) => {
              if (args) {
                setIsWalletLoading(WalletLoadingStates.CREATING_WALLET);
                const name = args?.name ?? '';
                const color = args?.color ?? null;
                // Check if the selected wallet is the primary
                let primaryWalletKey = selectedWallet.primary
                  ? selectedWallet.id
                  : null;

                // If it's not, then find it
                !primaryWalletKey &&
                  Object.keys(wallets as any).some(key => {
                    const wallet = wallets?.[key];
                    if (
                      wallet?.type === WalletTypes.mnemonic &&
                      wallet.primary
                    ) {
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
                    if (
                      wallet?.type === WalletTypes.mnemonic &&
                      wallet.imported
                    ) {
                      primaryWalletKey = key;
                      return true;
                    }
                    return false;
                  });

                try {
                  // If we found it and it's not damaged use it to create the new account
                  if (
                    primaryWalletKey &&
                    !wallets?.[primaryWalletKey].damaged
                  ) {
                    const newWallets = await dispatch(
                      createAccountForWallet(primaryWalletKey, color, name)
                    );
                    // @ts-ignore
                    await initializeWallet();
                    // If this wallet was previously backed up to the cloud
                    // We need to update userData backup so it can be restored too
                    if (
                      wallets?.[primaryWalletKey].backedUp &&
                      wallets[primaryWalletKey].backupType ===
                        WalletBackupTypes.cloud
                    ) {
                      try {
                        await backupUserDataIntoCloud({ wallets: newWallets });
                      } catch (e) {
                        logger.sentry(
                          'Updating wallet userdata failed after new account creation'
                        );
                        captureException(e);
                        throw e;
                      }
                    }

                    // If doesn't exist, we need to create a new wallet
                  } else {
                    await createWallet(
                      null,
                      color,
                      name,
                      false,
                      null,
                      null,
                      false,
                      true
                    );
                    await dispatch(walletsLoadState(profilesEnabled));
                    // @ts-ignore
                    await initializeWallet();
                  }
                } catch (e) {
                  logger.sentry('Error while trying to add account');
                  captureException(e);
                  if (isDamaged) {
                    setTimeout(() => {
                      showWalletErrorAlert();
                    }, 1000);
                  }
                }
              }
              creatingWallet.current = false;
              setIsWalletLoading(null);
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
      setIsWalletLoading(null);
      logger.log('Error while trying to add account', e);
    }
  }, [
    dispatch,
    goBack,
    initializeWallet,
    isDamaged,
    navigate,
    selectedWallet.id,
    selectedWallet.primary,
    setIsWalletLoading,
    wallets,
    profilesEnabled,
  ]);

  const onPressImportSeedPhrase = useCallback(() => {
    analytics.track('Tapped "Add an existing wallet"');
    navigate(Routes.IMPORT_SEED_PHRASE_FLOW);
  }, [navigate]);

  const onPressPairHardwareWallet = useCallback(() => {
    analytics.track('Tapped "Pair Hardware Wallet"');
    goBack();
    InteractionManager.runAfterInteractions(() => {
      navigate(Routes.PAIR_HARDWARE_WALLET_NAVIGATOR);
    });
  }, [goBack, navigate]);

  const onPressEditMode = useCallback(() => {
    analytics.track('Tapped "Edit"');
    setEditMode(e => !e);
  }, []);

  return (
    // @ts-ignore
    <Sheet borderRadius={30}>
      {android && <Whitespace />}
      <Column height={headerHeight} justify="space-between">
        <Centered>
          <SheetTitle testID="change-wallet-sheet-title">
            {lang.t('wallet.label')}
          </SheetTitle>

          {!watchOnly && (
            <Row style={{ position: 'absolute', right: 0 }}>
              <EditButton editMode={editMode} onPress={onPressEditMode}>
                <EditButtonLabel editMode={editMode}>
                  {editMode ? lang.t('button.done') : lang.t('button.edit')}
                </EditButtonLabel>
              </EditButton>
            </Row>
          )}
        </Centered>
        {showDividers && (
          // @ts-ignore
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
        onPressAddAccount={onPressAddAccount}
        onPressImportSeedPhrase={onPressImportSeedPhrase}
        onPressPairHardwareWallet={onPressPairHardwareWallet}
        scrollEnabled={scrollEnabled}
        showDividers={showDividers}
        watchOnly={watchOnly}
      />
    </Sheet>
  );
}
