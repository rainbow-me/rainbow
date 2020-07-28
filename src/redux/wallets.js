import { captureException } from '@sentry/react-native';
import { toChecksumAddress } from 'ethereumjs-util';
import { filter, flatMap, get, map, values } from 'lodash';
import { backupUserDataIntoCloud } from '../handlers/cloudBackup';
import { saveUserBackupState } from '../handlers/localstorage/globalSettings';
import {
  getWalletNames,
  saveWalletNames,
} from '../handlers/localstorage/walletNames';
import { web3Provider } from '../handlers/web3';
import BackupStateTypes from '../helpers/backupStateTypes';
import WalletBackupTypes from '../helpers/walletBackupTypes';
import WalletTypes from '../helpers/walletTypes';
import {
  generateAccount,
  getAllWallets,
  getSelectedWallet,
  hasKey,
  loadAddress,
  saveAddress,
  saveAllWallets,
  setSelectedWallet,
} from '../model/wallet';
import { settingsUpdateAccountAddress } from '../redux/settings';
import { logger } from '../utils';

// -- Constants --------------------------------------- //
const WALLETS_ADDED_ACCOUNT = 'wallets/WALLETS_ADDED_ACCOUNT';
const WALLETS_LOAD = 'wallets/ALL_WALLETS_LOAD';
const WALLETS_UPDATE = 'wallets/ALL_WALLETS_UPDATE';
const WALLETS_UPDATE_NAMES = 'wallets/WALLETS_UPDATE_NAMES';
const WALLETS_SET_IS_LOADING = 'wallets/WALLETS_SET_IS_LOADING';
const WALLETS_SET_SELECTED = 'wallets/SET_SELECTED';

// -- Actions ---------------------------------------- //
export const walletsLoadState = () => async (dispatch, getState) => {
  try {
    const { accountAddress } = getState().settings;
    let addressFromKeychain = accountAddress;
    const { wallets } = await getAllWallets();
    const selected = await getSelectedWallet();
    // Prevent irrecoverable state (no selected wallet)
    let selectedWallet = get(selected, 'wallet', undefined);
    // Check if the selected wallet is among all the wallets
    if (selectedWallet && !wallets[selectedWallet.id]) {
      // If not then we should clear it and default to the first one
      const firstWalletKey = Object.keys(wallets)[0];
      selectedWallet = wallets[firstWalletKey];
      await setSelectedWallet(selectedWallet);
    }

    if (!selectedWallet) {
      const address = await loadAddress();
      Object.keys(wallets).some(key => {
        const someWallet = wallets[key];
        const found = someWallet.addresses.some(account => {
          return (
            toChecksumAddress(account.address) === toChecksumAddress(address)
          );
        });
        if (found) {
          selectedWallet = someWallet;
          logger.sentry('Found selected wallet based on loadAddress result');
        }
        return found;
      });
    }

    // Recover from broken state (account address not in selected wallet)
    if (!addressFromKeychain) {
      addressFromKeychain = await loadAddress();
      logger.sentry(
        'addressFromKeychain wasnt set on settings so it is being loaded from loadAddress'
      );
    }

    const selectedAddress = selectedWallet.addresses.find(a => {
      return a.visible && a.address === addressFromKeychain;
    });

    if (!selectedAddress) {
      const account = selectedWallet.addresses.find(a => a.visible);
      await dispatch(settingsUpdateAccountAddress(account.address));
      await saveAddress(account.address);
      logger.sentry(
        'Selected the first visible address because there was not selected one'
      );
    }

    const walletNames = await getWalletNames();

    dispatch({
      payload: {
        selected: selectedWallet,
        walletNames,
        wallets,
      },
      type: WALLETS_LOAD,
    });

    dispatch(fetchWalletNames());
  } catch (error) {
    logger.sentry('Exception during walletsLoadState');
    captureException(error);
  }
};

export const walletsUpdate = wallets => dispatch => {
  saveAllWallets(wallets);
  dispatch({
    payload: wallets,
    type: WALLETS_UPDATE,
  });
};

export const walletsSetSelected = wallet => dispatch => {
  setSelectedWallet(wallet);
  dispatch({
    payload: wallet,
    type: WALLETS_SET_SELECTED,
  });
};

export const setIsWalletLoading = val => dispatch => {
  dispatch({
    payload: val,
    type: WALLETS_SET_IS_LOADING,
  });
};

export const setWalletBackedUp = (
  walletId,
  method,
  backupFile = null
) => async (dispatch, getState) => {
  const { wallets, selected } = getState().wallets;
  const newWallets = { ...wallets };
  newWallets[walletId].backedUp = true;
  newWallets[walletId].backupType = method;
  if (backupFile) {
    newWallets[walletId].backupFile = backupFile;
  }
  newWallets[walletId].backupDate = Date.now();
  dispatch(walletsUpdate(newWallets));
  if (selected.id === walletId) {
    dispatch(walletsSetSelected(newWallets[walletId]));
  }

  // Reset the loading state 1 second later
  setTimeout(() => {
    dispatch(setIsWalletLoading(null));
  }, 1000);

  if (method === WalletBackupTypes.cloud) {
    try {
      await backupUserDataIntoCloud({ wallets: newWallets });
    } catch (e) {
      logger.error('SAVING WALLET USERDATA FAILED', e);
    }
  }
  await saveUserBackupState(BackupStateTypes.done);
};

export const addressSetSelected = address => () => saveAddress(address);

export const createAccountForWallet = (id, color, name) => async (
  dispatch,
  getState
) => {
  const { wallets } = getState().wallets;
  const newWallets = { ...wallets };
  let index = 0;
  newWallets[id].addresses.forEach(
    account => (index = Math.max(index, account.index))
  );
  const newIndex = index + 1;
  const account = await generateAccount(id, newIndex);
  newWallets[id].addresses.push({
    address: account.address,
    avatar: null,
    color,
    index: newIndex,
    label: name,
    visible: true,
  });

  // Save all the wallets
  saveAllWallets(newWallets);
  // Set the address selected (KEYCHAIN)
  await saveAddress(account.address);
  // Set the wallet selected (KEYCHAIN)
  await setSelectedWallet(newWallets[id]);

  dispatch({
    payload: { selected: newWallets[id], wallets: newWallets },
    type: WALLETS_ADDED_ACCOUNT,
  });
};

export const fetchWalletNames = () => async (dispatch, getState) => {
  const { wallets } = getState().wallets;
  const updatedWalletNames = {};

  // Fetch ENS names
  await Promise.all(
    flatMap(values(wallets), wallet => {
      const visibleAccounts = filter(wallet.addresses, 'visible');
      return map(visibleAccounts, async account => {
        try {
          const ens = await web3Provider.lookupAddress(account.address);
          if (ens && ens !== account.address) {
            updatedWalletNames[account.address] = ens;
          }
          // eslint-disable-next-line no-empty
        } catch (error) {}
        return account;
      });
    })
  );

  dispatch({
    payload: updatedWalletNames,
    type: WALLETS_UPDATE_NAMES,
  });
  saveWalletNames(updatedWalletNames);
};

export const identifyBrokenWallet = () => async (dispatch, getState) => {
  const { wallets, selected } = getState().wallets;
  Object.keys(wallets)
    .filter(key => wallets[key].type !== WalletTypes.readOnly)
    .forEach(async key => {
      let keyFound = false;
      const wallet = wallets[key];
      if (wallet.type === WalletTypes.privateKey) {
        const account = wallet.addresses[0];
        keyFound = await hasKey(`${account.address}_rainbowPrivateKey`);
      } else {
        keyFound = await hasKey(`${key}_rainbowSeedPhrase`);
      }

      if (!keyFound) {
        wallet.damaged = true;
        dispatch(walletsUpdate(wallets));
        // Update selected wallet if needed
        if (wallet.id === selected.id) {
          dispatch(walletsSetSelected(wallets[wallet.id]));
        }
      }
    });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  isWalletLoading: null,
  selected: undefined,
  walletNames: {},
  wallets: null,
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case WALLETS_SET_IS_LOADING:
      return { ...state, isWalletLoading: action.payload };
    case WALLETS_SET_SELECTED:
      return { ...state, selected: action.payload };
    case WALLETS_UPDATE:
      return { ...state, wallets: action.payload };
    case WALLETS_UPDATE_NAMES:
      return { ...state, walletNames: action.payload };
    case WALLETS_LOAD:
      return {
        ...state,
        selected: action.payload.selected,
        walletNames: action.payload.walletNames,
        wallets: action.payload.wallets,
      };
    case WALLETS_ADDED_ACCOUNT:
      return {
        ...state,
        selected: action.payload.selected,
        wallets: action.payload.wallets,
      };
    default:
      return state;
  }
};
