import { toChecksumAddress } from 'ethereumjs-util';
import { filter, flatMap, get, map, toLower, values } from 'lodash';
import { backupUserDataIntoCloud } from '../handlers/cloudBackup';
import { saveUserBackupState } from '../handlers/localstorage/globalSettings';
import {
  getWalletNames,
  saveWalletNames,
} from '../handlers/localstorage/walletNames';
import { web3Provider } from '../handlers/web3';
import BackupStateTypes from '../helpers/backupStateTypes';
import WalletBackupTypes from '../helpers/walletBackupTypes';
import { keychainEventEmitter } from '../model/keychain';
import {
  generateAccount,
  getAllWallets,
  getSelectedWallet,
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
        }
        return found;
      });
    }

    // Recover from broken state (account address not in selected wallet)
    if (!addressFromKeychain) {
      addressFromKeychain = await loadAddress();
    }

    const selectedAddress = selectedWallet.addresses.find(a => {
      return a.visible && a.address === addressFromKeychain;
    });

    if (!selectedAddress) {
      const account = selectedWallet.addresses.find(a => a.visible);
      await dispatch(settingsUpdateAccountAddress(account.address));
      await saveAddress(account.address);
    }

    const walletNames = await getWalletNames();

    // Event listener for lost keychain items
    //  to mark the wallets as damaged
    keychainEventEmitter.on('keychainItemLostError', key => {
      let walletId;
      const { wallets, selected } = getState().wallets;
      // We need to derive the wallet id from the keychain item key
      if (key.indexOf('_rainbowSeedPhrase') !== -1) {
        walletId = key.replace('_rainbowSeedPhrase', '');
      } else if (key.indexOf('_rainbowPrivateKey') !== -1) {
        const address = key.replace('_rainbowPrivateKey', '');
        Object.keys(wallets).forEach(id => {
          const wallet = wallets[id];
          wallet.addresses.forEach(account => {
            if (toLower(account.address) === toLower(address)) {
              walletId = id;
            }
          });
        });
      }

      if (walletId) {
        wallets[walletId].damaged = true;
        dispatch(walletsUpdate(wallets));
        // Update selected wallet if needed
        if (walletId === selected.id) {
          dispatch(walletsSetSelected(wallets[walletId]));
        }
      }
    });

    dispatch({
      payload: {
        keychainEventEmitter,
        selected: selectedWallet,
        walletNames,
        wallets,
      },
      type: WALLETS_LOAD,
    });

    dispatch(fetchWalletNames());

    // eslint-disable-next-line no-empty
  } catch (error) {}
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
  wallet_id,
  method,
  backupFile = null
) => async (dispatch, getState) => {
  const { wallets, selected } = getState().wallets;
  const newWallets = { ...wallets };
  newWallets[wallet_id].backedUp = true;
  newWallets[wallet_id].backupType = method;
  if (backupFile) {
    newWallets[wallet_id].backupFile = backupFile;
  }
  newWallets[wallet_id].backupDate = Date.now();
  dispatch(walletsUpdate(newWallets));
  if (selected.id === wallet_id) {
    dispatch(walletsSetSelected(newWallets[wallet_id]));
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

export const deleteCloudBackup = wallet_id => async () => {
  throw new Error('I still need to code it!', wallet_id);
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

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  isWalletLoading: null,
  keychainEventEmitter: null,
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
        keychainEventEmitter: action.payload.keychainEventEmitter,
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
