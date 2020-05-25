import { get } from 'lodash';
import React, { useCallback, useRef, useState } from 'react';
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
import { removeWalletData } from '../handlers/localstorage/removeWallet';
import WalletTypes from '../helpers/walletTypes';
import { useAccountSettings, useInitializeWallet, useWallets } from '../hooks';
import { useWalletsWithBalancesAndNames } from '../hooks/useWalletsWithBalancesAndNames';
import { createWallet } from '../model/wallet';
import { useNavigation } from '../navigation/Navigation';
import {
  addressSetSelected,
  createAccountForWallet,
  walletsSetSelected,
  walletsUpdate,
} from '../redux/wallets';

import { colors, fonts } from '../styles';
import { abbreviations, deviceUtils, logger } from '../utils';
import { showActionSheetWithOptions } from '../utils/actionsheet';
import Routes from './Routes/routesNames';

const deviceHeight = deviceUtils.dimensions.height;
const addAccountRowHeight = 55;
const footerHeight = 61;
const listPaddingBottom = 17;
const walletRowHeight = 59;
const maxListHeight = deviceHeight - 220;

const EditButton = styled(ButtonPressAnimation).attrs({ scaleTo: 0.96 })`
  padding: 12px;
  position: absolute;
  right: 7px;
  top: 6px;
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

const getAddAccountRowCount = wallets => {
  let count = 0;
  if (wallets) {
    Object.keys(wallets).forEach(key => {
      count +=
        wallets[key].type === WalletTypes.mnemonic ||
        wallets[key].type === WalletTypes.seed;
    });
  }
  // Always add space for create wallet row
  if (count === 0) {
    count = 1;
  }
  return count;
};

const ChangeWalletSheet = () => {
  const { wallets, selectedWallet } = useWallets();
  const [editMode, setEditMode] = useState(false);

  const { goBack, navigate } = useNavigation();
  const dispatch = useDispatch();
  const { accountAddress } = useAccountSettings();
  const initializeWallet = useInitializeWallet();
  const walletsWithBalancesAndNames = useWalletsWithBalancesAndNames(wallets);
  const creatingWallet = useRef();

  const walletRowCount = getWalletRowCount(wallets);
  const addAccountRowCount = getAddAccountRowCount(wallets);

  let listHeight =
    walletRowHeight * walletRowCount +
    addAccountRowHeight * addAccountRowCount +
    footerHeight +
    listPaddingBottom;
  let scrollEnabled = false;
  if (listHeight > maxListHeight) {
    listHeight = maxListHeight;
    scrollEnabled = true;
  }

  const onChangeAccount = useCallback(
    async (walletId, address, fromDeletion = false) => {
      if (editMode && !fromDeletion) return;
      if (address === accountAddress) return;
      try {
        const wallet = wallets[walletId];
        dispatch(walletsSetSelected(wallet));
        dispatch(addressSetSelected(address));
        initializeWallet();
        !fromDeletion && goBack();
      } catch (e) {
        logger.log('error while switching account', e);
      }
    },
    [accountAddress, dispatch, editMode, goBack, initializeWallet, wallets]
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
                      if (selectedWallet.id === walletId) {
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
            type: 'wallet_profile_creator',
          });
        }, 50);
      });
    },
    [dispatch, goBack, navigate, selectedWallet.id, wallets]
  );

  const onEditWallet = useCallback(
    (walletId, address, label) => {
      // If there's more than 1 account
      // it's deletable
      let isDeletable = false;
      for (let i = 0; i < Object.keys(wallets).length; i++) {
        const key = Object.keys(wallets)[i];
        const someWallet = wallets[key];
        const otherAccount = someWallet.addresses.find(
          account => account.visible && account.address !== address
        );
        if (otherAccount) {
          isDeletable = true;
          break;
        }
      }

      const buttons = ['Edit Wallet'];
      if (isDeletable) {
        buttons.push('Delete Wallet');
      }
      buttons.push('Cancel');

      showActionSheetWithOptions(
        {
          cancelButtonIndex: isDeletable ? 2 : 1,
          destructiveButtonIndex: isDeletable ? 1 : null,
          options: buttons,
          title: `${label || abbreviations.address(address, 4, 6)}`,
        },
        buttonIndex => {
          if (buttonIndex === 0) {
            // Edit wallet
            renameWallet(walletId, address);
          } else if (isDeletable && buttonIndex === 1) {
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
                  // If we're deleting the selected wallet
                  // we need to switch to another one
                  if (address === accountAddress) {
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
            );
          }
        }
      );
    },
    [accountAddress, deleteWallet, onChangeAccount, renameWallet, wallets]
  );

  const onPressAddAccount = useCallback(
    async walletId => {
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
                  const name = get(args, 'name', '');
                  const color = get(args, 'color', colors.getRandomColor());
                  if (walletId) {
                    await dispatch(
                      createAccountForWallet(walletId, color, name)
                    );
                    await initializeWallet();
                  } else {
                    await createWallet(null, color, name);
                    await initializeWallet();
                  }
                }
                creatingWallet.current = false;
              },
              profile: {
                color: null,
                name: ``,
              },
              type: 'wallet_profile_creator',
            });
          }, 50);
        });
      } catch (e) {
        logger.log('Error while trying to add account', e);
      }
    },
    [dispatch, goBack, initializeWallet, navigate]
  );

  const onPressImportSeedPhrase = useCallback(() => {
    navigate(Routes.IMPORT_SEED_PHRASE_SHEET);
  }, [navigate]);

  const toggleEditMode = useCallback(() => {
    setEditMode(!editMode);
  }, [editMode]);

  return (
    <Sheet borderRadius={30}>
      <Column height={42} justify="space-between">
        <SheetTitle>Wallets</SheetTitle>
        <Divider color={colors.rowDividerExtraLight} />
      </Column>
      <EditButton onPress={toggleEditMode}>
        <Text
          align="right"
          color={colors.appleBlue}
          letterSpacing="roundedMedium"
          size="large"
          weight={editMode ? fonts.weight.semibold : fonts.weight.medium}
        >
          {editMode ? 'Done' : 'Edit'}
        </Text>
      </EditButton>

      <WalletList
        accountAddress={accountAddress}
        allWallets={walletsWithBalancesAndNames}
        currentWallet={selectedWallet}
        editMode={editMode}
        height={listHeight}
        onChangeAccount={onChangeAccount}
        onEditWallet={onEditWallet}
        onPressAddAccount={onPressAddAccount}
        onPressImportSeedPhrase={onPressImportSeedPhrase}
        scrollEnabled={scrollEnabled}
      />
    </Sheet>
  );
};

export default ChangeWalletSheet;
