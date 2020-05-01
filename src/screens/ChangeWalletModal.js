import React, { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { useDispatch } from 'react-redux';
import WalletList from '../components/change-wallet/WalletList';
import { Modal } from '../components/modal';
import WalletTypes from '../helpers/walletTypes';
import { useAccountSettings, useInitializeWallet, useWallets } from '../hooks';
import {
  addressSetSelected,
  createAccountForWallet,
  walletsSetSelected,
  walletsUpdate,
} from '../redux/wallets';
import { logger } from '../utils';
import Routes from './Routes/routesNames';

const walletRowHeight = 54;

const ChangeWalletModal = () => {
  const { wallets, selected: selectedWallet } = useWallets();

  const { goBack, navigate } = useNavigation();
  const dispatch = useDispatch();
  const { accountAddress } = useAccountSettings();
  const initializeWallet = useInitializeWallet();
  const rowsCount = useMemo(() => {
    let count = 0;
    if (wallets) {
      Object.keys(wallets).forEach(key => {
        // Wallet header
        // If there's more than account we group them by wallet
        if (wallets[key].addresses.length > 1) {
          count += 1;
        }
        // Addresses
        count += wallets[key].addresses.filter(account => account.visible)
          .length;

        // Add account
        if (
          [WalletTypes.mnemonic, WalletTypes.seed].indexOf(
            wallets[key].type
          ) !== -1
        ) {
          count += 1;
        }
      });
      // Import wallet
      count += 1;
    }
    return count;
  }, [wallets]);

  let listHeight = walletRowHeight * rowsCount;
  if (listHeight > 298) {
    listHeight = 298;
  }

  const onChangeAccount = useCallback(
    async (wallet_id, address) => {
      try {
        const wallet = wallets[wallet_id];
        dispatch(walletsSetSelected(wallet));
        dispatch(addressSetSelected(address));
        await initializeWallet();
        goBack();
      } catch (e) {
        logger.log('error while switching account', e);
      }
    },
    [dispatch, goBack, initializeWallet, wallets]
  );

  const onEditWallet = useCallback(
    id => {
      const wallet = wallets[id];
      if (!selectedWallet) return;

      let isDeletable = false;
      if (Object.keys(wallet).length > 1 && selectedWallet.id !== id) {
        isDeletable = true;
      }
      navigate(Routes.MODAL_SCREEN, {
        address: undefined,
        asset: [],
        isDeletable,
        onCloseModal: async args => {
          if (args) {
            const newWallets = { ...wallets };
            if (args.name) {
              newWallets[id].name = args.name;
              newWallets[id].color = args.color;
              if (selectedWallet.id === id) {
                await dispatch(walletsSetSelected(newWallets[id]));
              }
            } else if (args.isDeleted) {
              delete newWallets[id];
            }
            await dispatch(walletsUpdate(newWallets));
          }
        },
        profile: { color: wallet.color, name: wallet.name },
        type: 'wallet_profile_creator',
      });
    },
    [dispatch, navigate, selectedWallet, wallets]
  );

  const onEditAddress = useCallback(
    (wallet_id, address) => {
      const wallet = wallets[wallet_id];
      const account = wallet.addresses.find(
        account => account.address === address
      );
      let isDeletable = false;
      if (accountAddress !== address) {
        isDeletable = true;
      }
      navigate(Routes.MODAL_SCREEN, {
        address,
        asset: [],
        isDeletable,
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
            } else if (args.isDeleted) {
              newWallets[wallet_id].addresses.some((account, index) => {
                if (account.address === address) {
                  newWallets[wallet_id].addresses[index].visible = false;

                  return true;
                }
                return false;
              });
            }
            await dispatch(walletsUpdate(newWallets));
          }
        },
        profile: {
          color: account.color,
          name: account.label || `Account ${account.index + 1}`,
        },
        type: 'wallet_profile_creator',
      });
    },
    [accountAddress, dispatch, navigate, selectedWallet.id, wallets]
  );

  const onCloseModal = useCallback(() => goBack(), [goBack]);

  const onPressAddAccount = useCallback(
    async wallet_id => {
      try {
        await dispatch(createAccountForWallet(wallet_id));
        await initializeWallet();
      } catch (e) {
        logger.log('Error while trying to add account', e);
      }
    },
    [dispatch, initializeWallet]
  );

  const onPressImportSeedPhrase = useCallback(() => {
    goBack();
    navigate(Routes.IMPORT_SEED_PHRASE_SHEET);
  }, [goBack, navigate]);

  return (
    <View>
      <Modal
        fixedToTop
        height={listHeight + 30}
        onCloseModal={onCloseModal}
        style={{ borderRadius: 18 }}
      >
        <WalletList
          currentWallet={selectedWallet}
          accountAddress={accountAddress}
          allWallets={wallets}
          height={listHeight}
          onChangeAccount={onChangeAccount}
          onEditAddress={onEditAddress}
          onEditWallet={onEditWallet}
          onPressImportSeedPhrase={onPressImportSeedPhrase}
          onPressAddAccount={onPressAddAccount}
        />
      </Modal>
    </View>
  );
};

export default ChangeWalletModal;
