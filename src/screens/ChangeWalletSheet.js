import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View } from 'react-native';
import { Transition, Transitioning } from 'react-native-reanimated';
import { useNavigation } from 'react-navigation-hooks';
import { useDispatch } from 'react-redux';
import { withProps } from 'recompact';
import { ButtonPressAnimation } from '../components/animations';
import { EmptyAssetList } from '../components/asset-list';
import WalletList from '../components/change-wallet/WalletList';
import { Sheet } from '../components/sheet';
import { Text } from '../components/text';
import WalletTypes from '../helpers/walletTypes';
import {
  useAccountSettings,
  useInitializeWallet,
  usePrevious,
  useWallets,
} from '../hooks';
import { useWalletsWithBalancesAndNames } from '../hooks/useWalletsWithBalancesAndNames';
import {
  addressSetSelected,
  createAccountForWallet,
  walletsSetSelected,
  walletsUpdate,
} from '../redux/wallets';

import { colors, position } from '../styles';
import { abbreviations, logger } from '../utils';
import { showActionSheetWithOptions } from '../utils/actionsheet';
import Routes from './Routes/routesNames';

const walletRowHeight = 60;
const titleHeight = 70;
const footerHeight = 65;
const maxListHeight = 360;
const Title = withProps({
  align: 'center',
  size: 'large',
  weight: 'bold',
})(Text);

const EditText = withProps({
  align: 'center',
  color: colors.appleBlue,
  size: 'large',
  weight: 'semibold',
})(Text);

const EditButton = withProps({
  scaleTo: 0.9,
  style: {
    position: 'absolute',
    right: 20,
    top: 26,
  },
})(ButtonPressAnimation);

const skeletonTransition = (
  <Transition.Sequence>
    <Transition.Out interpolation="easeOut" type="fade" />
    <Transition.Change durationMs={0.001} interpolation="easeOut" />
    <Transition.In durationMs={0.001} interpolation="easeOut" type="fade" />
  </Transition.Sequence>
);

const ChangeWalletSheet = () => {
  const { wallets, selected: selectedWallet } = useWallets();
  const [editMode, setEditMode] = useState(false);

  const { goBack, navigate } = useNavigation();
  const dispatch = useDispatch();
  const { accountAddress } = useAccountSettings();
  const initializeWallet = useInitializeWallet();
  const walletsWithBalancesAndNames = useWalletsWithBalancesAndNames(wallets);
  const prevWalletsWithBalancesAndNames = usePrevious(
    walletsWithBalancesAndNames
  );

  const rowsCount = useMemo(() => {
    let count = 0;
    if (wallets) {
      Object.keys(wallets).forEach(key => {
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
    }
    return count;
  }, [wallets]);

  let listHeight = walletRowHeight * rowsCount + titleHeight + footerHeight;
  if (listHeight > maxListHeight) {
    listHeight = maxListHeight;
  }
  const skeletonHeight = listHeight + 55;

  const onChangeAccount = useCallback(
    async (wallet_id, address) => {
      if (editMode) return;
      if (address === accountAddress) return;
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
    [accountAddress, dispatch, editMode, goBack, initializeWallet, wallets]
  );

  const deleteWallet = useCallback(
    async (wallet_id, address) => {
      const newWallets = { ...wallets };
      // mark it as hidden
      newWallets[wallet_id].addresses.some((account, index) => {
        if (account.address === address) {
          newWallets[wallet_id].addresses[index].visible = false;
          return true;
        }
        return false;
      });
      // if there are no visible wallets, then delete the wallet
      const visibleAdddresses = newWallets[wallet_id].addresses.filter(
        account => account.visible
      );
      if (visibleAdddresses.length === 0) {
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

      navigate(Routes.EXPANDED_ASSET_SCREEN, {
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
      const wallet = wallets[wallet_id];
      if (!selectedWallet) return;

      let isDeletable = false;
      if (Object.keys(wallet).length > 1 && selectedWallet.id !== wallet_id) {
        isDeletable = true;
      }

      const buttons = ['Rename Wallet'];
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
            // Delete wallet
            deleteWallet(wallet_id, address);
          }
        }
      );
    },
    [deleteWallet, renameWallet, selectedWallet, wallets]
  );

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

  const skeletonTransitionRef = useRef();

  const toggleEditMode = useCallback(() => {
    setEditMode(!editMode);
  }, [editMode]);

  useEffect(() => {
    skeletonTransitionRef &&
      skeletonTransitionRef.current &&
      skeletonTransitionRef.current.animateNextTransition();
  }, [prevWalletsWithBalancesAndNames]);

  return (
    <Sheet>
      <Title>Wallets</Title>
      <EditButton onPress={toggleEditMode}>
        <EditText>{editMode ? 'Done' : 'Edit'}</EditText>
      </EditButton>
      {walletsWithBalancesAndNames ? (
        <WalletList
          editMode={editMode}
          currentWallet={selectedWallet}
          accountAddress={accountAddress}
          allWallets={walletsWithBalancesAndNames}
          height={listHeight}
          onChangeAccount={onChangeAccount}
          onEditWallet={onEditWallet}
          onPressImportSeedPhrase={onPressImportSeedPhrase}
          onPressAddAccount={onPressAddAccount}
        />
      ) : (
        <View style={{ height: skeletonHeight, marginTop: 19 }}>
          <Transitioning.View
            flex={1}
            ref={skeletonTransitionRef}
            transition={skeletonTransition}
          >
            <EmptyAssetList
              {...position.coverAsObject}
              backgroundColor={colors.white}
              pointerEvents="none"
            />
          </Transitioning.View>
        </View>
      )}
    </Sheet>
  );
};

export default ChangeWalletSheet;
