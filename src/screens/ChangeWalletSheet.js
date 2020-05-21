import { get } from 'lodash';
import React, { useCallback, useRef, useState } from 'react';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useNavigation } from 'react-navigation-hooks';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import Divider from '../components/Divider';
import { ButtonPressAnimation } from '../components/animations';
import WalletList from '../components/change-wallet/WalletList';
import { Column } from '../components/layout';
import { Sheet, SheetTitle } from '../components/sheet';
import { Text } from '../components/text';
import WalletTypes from '../helpers/walletTypes';
import { useAccountSettings, useInitializeWallet, useWallets } from '../hooks';
import { useWalletsWithBalancesAndNames } from '../hooks/useWalletsWithBalancesAndNames';
import { createWallet } from '../model/wallet';
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
    async (wallet_id, address, fromDeletion = false) => {
      if (editMode && !fromDeletion) return;
      if (address === accountAddress) return;
      try {
        const wallet = wallets[wallet_id];
        dispatch(walletsSetSelected(wallet));
        dispatch(addressSetSelected(address));
        await initializeWallet();
        !fromDeletion && goBack();
      } catch (e) {
        logger.log('error while switching account', e);
      }
    },
    [accountAddress, dispatch, editMode, goBack, initializeWallet, wallets]
  );

  const deleteWallet = useCallback(
    async (wallet_id, address) => {
      const newWallets = { ...wallets };
      // Mark it as hidden
      newWallets[wallet_id].addresses.some((account, index) => {
        if (account.address === address) {
          newWallets[wallet_id].addresses[index].visible = false;
          return true;
        }
        return false;
      });
      // If there are no visible wallets
      // then delete the wallet
      const visibleAddresses = newWallets[wallet_id].addresses.filter(
        account => account.visible
      );
      if (visibleAddresses.length === 0) {
        delete newWallets[wallet_id];
      }
      await dispatch(walletsUpdate(newWallets));
    },
    [dispatch, wallets]
  );

  const renameWallet = useCallback(
    (wallet_id, address) => {
      const wallet = wallets[wallet_id];
      const account = wallet.addresses.find(
        account => account.address === address
      );

      navigate(Routes.MODAL_SCREEN, {
        address,
        asset: [],
        onCloseModal: async args => {
          if (args) {
            const newWallets = { ...wallets };
            if (args.name) {
              newWallets[wallet_id].addresses.some((account, index) => {
                if (account.address === address) {
                  newWallets[wallet_id].addresses[index].label = args.name;
                  newWallets[wallet_id].addresses[index].color = args.color;
                  if (selectedWallet.id === wallet_id) {
                    dispatch(walletsSetSelected(newWallets[wallet_id]));
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
    },
    [dispatch, navigate, selectedWallet.id, wallets]
  );

  const onEditWallet = useCallback(
    (wallet_id, address, label) => {
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
            renameWallet(wallet_id, address);
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
                  await deleteWallet(wallet_id, address);
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
    async wallet_id => {
      try {
        if (creatingWallet.current) return;
        creatingWallet.current = true;
        // Show naming modal
        navigate(Routes.MODAL_SCREEN, {
          actionType: 'Create',
          asset: [],
          isNewProfile: true,
          onCloseModal: async args => {
            if (args) {
              const name = get(args, 'name', '');
              const color = get(args, 'color', colors.getRandomColor());
              if (wallet_id) {
                await dispatch(createAccountForWallet(wallet_id, color, name));
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
      } catch (e) {
        logger.log('Error while trying to add account', e);
      }
    },
    [dispatch, initializeWallet, navigate]
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
