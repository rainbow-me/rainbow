import { captureException } from '@sentry/react-native';
import { get } from 'lodash';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { InteractionManager } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import Divider from '../components/Divider';
import { ButtonPressAnimation } from '../components/animations';
import WalletList from '../components/change-wallet/WalletList';
import { Column } from '../components/layout';
import { Sheet, SheetTitle } from '../components/sheet';
import { Text } from '../components/text';
import { backupUserDataIntoCloud } from '../handlers/cloudBackup';
import { removeWalletData } from '../handlers/localstorage/removeWallet';
import showWalletErrorAlert from '../helpers/support';
import WalletLoadingStates from '../helpers/walletLoadingStates';
import WalletTypes from '../helpers/walletTypes';
import { useWalletsWithBalancesAndNames } from '../hooks/useWalletsWithBalancesAndNames';
import { wipeKeychain } from '../model/keychain';
import { createWallet } from '../model/wallet';
import { useNavigation } from '../navigation/Navigation';
import {
  addressSetSelected,
  createAccountForWallet,
  walletsLoadState,
  walletsSetSelected,
  walletsUpdate,
} from '../redux/wallets';
import WalletBackupTypes from '@rainbow-me/helpers/walletBackupTypes';
import {
  useAccountSettings,
  useInitializeWallet,
  useWallets,
} from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';
import { colors } from '@rainbow-me/styles';
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
  radiusAndroid: 24,
  scaleTo: 0.96,
  wrapperStyle: {
    alignSelf: 'flex-end',
    height: 40,
    marginRight: 7,
    width: editMode ? 70 : 58,
  },
}))`
  padding: 12px;
  ${ios
    ? `
  position: absolute;
  right: 7px;
  top: 6px;
  `
    : `
    position: relative;
    right: 0px;
    top: -10px;
    z-index: 99999;
  `}
`;

const EditButtonLabel = styled(Text).attrs(({ editMode }) => ({
  align: 'right',
  color: colors.appleBlue,
  letterSpacing: 'roundedMedium',
  size: 'large',
  weight: editMode ? 'semibold' : 'medium',
}))``;

const Whitespace = styled.View`
  background-color: ${colors.white};
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
  const {
    isDamaged,
    selectedWallet,
    setIsWalletLoading,
    wallets,
  } = useWallets();
  const [editMode, setEditMode] = useState(false);

  const { goBack, navigate, replace } = useNavigation();
  const dispatch = useDispatch();
  const { accountAddress } = useAccountSettings();
  const initializeWallet = useInitializeWallet();
  const walletsWithBalancesAndNames = useWalletsWithBalancesAndNames();
  const creatingWallet = useRef();

  const [currentAddress, setCurrentAddress] = useState(accountAddress);
  const [currentSelectedWallet, setCurrentSelectedWallet] = useState(
    selectedWallet
  );

  const walletRowCount = useMemo(() => getWalletRowCount(wallets), [wallets]);

  let headerHeight = android ? 0 : 30;
  let listHeight =
    walletRowHeight * walletRowCount + footerHeight + listPaddingBottom;
  let scrollEnabled = false;
  let showDividers = false;
  if (listHeight > maxListHeight) {
    headerHeight = android ? 0 : 40;
    listHeight = maxListHeight;
    scrollEnabled = true;
    showDividers = true;
  }

  useEffect(() => {
    setCurrentAddress(accountAddress);
  }, [accountAddress]);

  const onChangeAccount = useCallback(
    async (walletId, address, fromDeletion = false) => {
      if (editMode && !fromDeletion) return;
      if (address === currentAddress) return;
      try {
        const wallet = wallets[walletId];
        setCurrentAddress(address);
        setCurrentSelectedWallet(wallet);
        const p1 = dispatch(walletsSetSelected(wallet));
        const p2 = dispatch(addressSetSelected(address));
        await Promise.all([p1, p2]);

        initializeWallet();
        !fromDeletion && goBack();
      } catch (e) {
        logger.log('error while switching account', e);
      }
    },
    [currentAddress, dispatch, editMode, goBack, initializeWallet, wallets]
  );

  const deleteWallet = useCallback(
    async (walletId, address) => {
      const newWallets = { ...wallets };
      // Mark it as hidden
      newWallets[walletId].addresses.some((account, index) => {
        if (account.address === address) {
          newWallets[walletId].addresses[index].visible = false;
          return true;
        }
        return false;
      });
      // If there are no visible wallets
      // then delete the wallet
      const visibleAddresses = newWallets[walletId].addresses.filter(
        account => account.visible
      );
      if (visibleAddresses.length === 0) {
        delete newWallets[walletId];
      }
      await dispatch(walletsUpdate(newWallets));
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
                  newWallets[walletId].addresses.some((account, index) => {
                    if (account.address === address) {
                      newWallets[walletId].addresses[index].label = args.name;
                      newWallets[walletId].addresses[index].color = args.color;
                      if (currentSelectedWallet.id === walletId) {
                        setCurrentSelectedWallet(wallet);
                        dispatch(walletsSetSelected(newWallets[walletId]));
                      }
                      return true;
                    }
                    return false;
                  });
                  await dispatch(walletsUpdate(newWallets));
                }
              }
            },
            profile: {
              color: account.color,
              name: account.label || ``,
            },
            type: 'wallet_profile',
          });
        }, 50);
      });
    },
    [dispatch, goBack, navigate, currentSelectedWallet.id, wallets]
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
            renameWallet(walletId, address);
          } else if (buttonIndex === 1) {
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
                  await deleteWallet(walletId, address);
                  ReactNativeHapticFeedback.trigger('notificationSuccess');

                  if (!isLastAvailableWallet) {
                    await wipeKeychain();
                    goBack();
                    replace(Routes.WELCOME_SCREEN);
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
      replace,
      wallets,
    ]
  );

  const onPressAddAccount = useCallback(async () => {
    try {
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
                const color = get(args, 'color', colors.getRandomColor());
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
    navigate(Routes.IMPORT_SEED_PHRASE_FLOW);
  }, [navigate]);

  return (
    <Sheet borderRadius={30}>
      {android && <Whitespace />}
      <Column height={headerHeight} justify="space-between">
        <SheetTitle>Wallets</SheetTitle>
        {showDividers && (
          <Divider color={colors.rowDividerExtraLight} inset={[0, 15]} />
        )}
      </Column>
      <EditButton editMode={editMode} onPress={() => setEditMode(e => !e)}>
        <EditButtonLabel editMode={editMode}>
          {editMode ? 'Done' : 'Edit'}
        </EditButtonLabel>
      </EditButton>
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
      />
    </Sheet>
  );
}
