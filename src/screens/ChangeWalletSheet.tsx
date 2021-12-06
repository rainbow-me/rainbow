import { useRoute } from '@react-navigation/core';
import analytics from '@segment/analytics-react-native';
import { captureException } from '@sentry/react-native';
import { get, toLower } from 'lodash';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { InteractionManager } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import Divider from '../components/Divider';
import { ButtonPressAnimation } from '../components/animations';
import WalletList from '../components/change-wallet/WalletList';
import { Centered, Column, Row } from '../components/layout';
import { Sheet, SheetTitle } from '../components/sheet';
import { Text } from '../components/text';
import { backupUserDataIntoCloud } from '../handlers/cloudBackup';
import { removeWalletData } from '../handlers/localstorage/removeWallet';
import showWalletErrorAlert from '../helpers/support';
import WalletLoadingStates from '../helpers/walletLoadingStates';
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
import { asyncSome } from '@rainbow-me/helpers/utilities';
import WalletBackupTypes from '@rainbow-me/helpers/walletBackupTypes';
import {
  useAccountSettings,
  useInitializeWallet,
  useWallets,
  useWalletsWithBalancesAndNames,
  useWebData,
} from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';
import {
  abbreviations,
  deviceUtils,
  showActionSheetWithOptions,
} from '@rainbow-me/utils';

import logger from 'logger';

const deviceHeight = deviceUtils.dimensions.height;
const footerHeight = 111;
const listPaddingBottom = 6;
const walletRowHeight = 59;
const maxListHeight = deviceHeight - 220;

const EditButton = styled(ButtonPressAnimation).attrs(({ editMode }) => ({
  scaleTo: 0.96,
  wrapperStyle: {
    width: editMode ? 70 : 58,
  },
}))`
  ${ios
    ? `
    position: absolute;
    right: 20px;
    top: -11px;`
    : `
    position: relative;
    right: 20px;
    top: 6px;
    elevation: 10;
  `}
`;

const EditButtonLabel = styled(Text).attrs(
  ({ theme: { colors }, editMode }) => ({
    align: 'right',
    color: colors.appleBlue,
    letterSpacing: 'roundedMedium',
    size: 'large',
    weight: editMode ? 'bold' : 'semibold',
  })
)`
  height: 40px;
`;
const Whitespace = styled.View`
  background-color: ${({ theme: { colors } }) => colors.white};
  bottom: -400px;
  height: 400px;
  position: absolute;
  width: 100%;
`;

const getWalletRowCount = wallets => {
  let count = 0;
  if (wallets) {
    Object.keys(wallets).forEach(key => {
      // Addresses
      count += wallets[key].addresses.filter(account => account.visible).length;
    });
  }
  return count;
};

export default function ChangeWalletSheet() {
  const { params = {} } = useRoute();
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
  const creatingWallet = useRef();

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
      const wallet = wallets[walletId];
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

        initializeWallet(null, null, null, false, false, null, true);
        !fromDeletion && goBack();
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
          ...wallets[walletId],
          addresses: wallets[walletId].addresses.map(account =>
            toLower(account.address) === toLower(address)
              ? { ...account, visible: false }
              : account
          ),
        },
      };
      // If there are no visible wallets
      // then delete the wallet
      const visibleAddresses = newWallets[walletId].addresses.filter(
        account => account.visible
      );
      if (visibleAddresses.length === 0) {
        delete newWallets[walletId];
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
      const wallet = wallets[walletId];
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
            onCloseModal: async args => {
              if (args) {
                const newWallets = { ...wallets };
                if ('name' in args) {
                  analytics.track('Tapped "Done" after editing wallet', {
                    wallet_label: args.name,
                  });
                  asyncSome(
                    newWallets[walletId].addresses,
                    async (account, index) => {
                      if (account.address === address) {
                        newWallets[walletId].addresses[index].label = args.name;
                        newWallets[walletId].addresses[index].color =
                          args.color;
                        if (currentSelectedWallet.id === walletId) {
                          await setCurrentSelectedWallet(wallet);
                          await dispatch(
                            walletsSetSelected(newWallets[walletId])
                          );
                        }
                        updateWebProfile(
                          address,
                          args.name,
                          colors.avatarBackgrounds[args.color]
                        );
                        return true;
                      }
                      return false;
                    }
                  );
                  await dispatch(walletsUpdate(newWallets));
                } else {
                  analytics.track('Tapped "Cancel" after editing wallet');
                }
              }
            },
            profile: {
              color: account.color,
              image: account.image || ``,
              name: account.label || ``,
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

  const onEditWallet = useCallback(
    (walletId, address, label) => {
      // If there's more than 1 account
      // it's deletable
      let isLastAvailableWallet = false;
      for (let i = 0; i < Object.keys(wallets).length; i++) {
        const key = Object.keys(wallets)[i];
        const someWallet = wallets[key];
        const otherAccount = someWallet.addresses.find(
          account => account.visible && account.address !== address
        );
        if (otherAccount) {
          isLastAvailableWallet = true;
          break;
        }
      }

      const buttons = ['Edit Wallet'];
      buttons.push('Delete Wallet');
      buttons.push('Cancel');

      showActionSheetWithOptions(
        {
          cancelButtonIndex: 2,
          destructiveButtonIndex: 1,
          options: buttons,
          title: `${label || abbreviations.address(address, 4, 6)}`,
        },
        buttonIndex => {
          if (buttonIndex === 0) {
            // Edit wallet
            analytics.track('Tapped "Edit Wallet"');
            renameWallet(walletId, address);
          } else if (buttonIndex === 1) {
            analytics.track('Tapped "Delete Wallet"');
            // Delete wallet with confirmation
            showActionSheetWithOptions(
              {
                cancelButtonIndex: 1,
                destructiveButtonIndex: 0,
                message: `Are you sure you want to delete this wallet?`,
                options: ['Delete Wallet', 'Cancel'],
              },
              async buttonIndex => {
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
                    if (address === currentAddress) {
                      for (let i = 0; i < Object.keys(wallets).length; i++) {
                        const key = Object.keys(wallets)[i];
                        const someWallet = wallets[key];
                        const found = someWallet.addresses.find(
                          account =>
                            account.visible && account.address !== address
                        );

                        if (found) {
                          await onChangeAccount(key, found.address, true);
                          break;
                        }
                      }
                    }
                  }
                }
              }
            );
          }
        }
      );
    },
    [
      currentAddress,
      deleteWallet,
      goBack,
      onChangeAccount,
      renameWallet,
      navigate,
      wallets,
    ]
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
            onCloseModal: async args => {
              if (args) {
                setIsWalletLoading(WalletLoadingStates.CREATING_WALLET);
                const name = get(args, 'name', '');
                const color = get(args, 'color', null);
                // Check if the selected wallet is the primary
                let primaryWalletKey = selectedWallet.primary
                  ? selectedWallet.id
                  : null;

                // If it's not, then find it
                !primaryWalletKey &&
                  Object.keys(wallets).some(key => {
                    const wallet = wallets[key];
                    if (
                      wallet.type === WalletTypes.mnemonic &&
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
                  Object.keys(wallets).some(key => {
                    const wallet = wallets[key];
                    if (
                      wallet.type === WalletTypes.mnemonic &&
                      wallet.imported
                    ) {
                      primaryWalletKey = key;
                      return true;
                    }
                    return false;
                  });

                try {
                  // If we found it and it's not damaged use it to create the new account
                  if (primaryWalletKey && !wallets[primaryWalletKey].damaged) {
                    const newWallets = await dispatch(
                      createAccountForWallet(primaryWalletKey, color, name)
                    );
                    await initializeWallet();
                    // If this wallet was previously backed up to the cloud
                    // We need to update userData backup so it can be restored too
                    if (
                      wallets[primaryWalletKey].backedUp &&
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
                    await createWallet(null, color, name);
                    await dispatch(walletsLoadState());
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
  ]);

  const onPressImportSeedPhrase = useCallback(() => {
    analytics.track('Tapped "Add an existing wallet"');
    navigate(Routes.IMPORT_SEED_PHRASE_FLOW);
  }, [navigate]);

  const onPressEditMode = useCallback(() => {
    analytics.track('Tapped "Edit"');
    setEditMode(e => !e);
  }, []);

  return (
    <Sheet borderRadius={30}>
      {android && <Whitespace />}
      <Column height={headerHeight} justify="space-between">
        <Centered>
          <SheetTitle>Wallets</SheetTitle>

          {!watchOnly && (
            <Row style={{ position: 'absolute', right: 0 }}>
              <EditButton editMode={editMode} onPress={onPressEditMode}>
                <EditButtonLabel editMode={editMode}>
                  {editMode ? 'Done' : 'Edit'}
                </EditButtonLabel>
              </EditButton>
            </Row>
          )}
        </Centered>
        {showDividers && (
          <Divider color={colors.rowDividerExtraLight} inset={[0, 15]} />
        )}
      </Column>

      <WalletList
        accountAddress={currentAddress}
        allWallets={walletsWithBalancesAndNames}
        currentWallet={currentSelectedWallet}
        editMode={editMode}
        height={listHeight}
        onChangeAccount={onChangeAccount}
        onEditWallet={onEditWallet}
        onPressAddAccount={onPressAddAccount}
        onPressImportSeedPhrase={onPressImportSeedPhrase}
        scrollEnabled={scrollEnabled}
        showDividers={showDividers}
        watchOnly={watchOnly}
      />
    </Sheet>
  );
}
