import { toChecksumAddress } from 'ethereumjs-util';
import { filter, flatMap, get, map, values } from 'lodash';
import {
  getWalletNames,
  saveWalletNames,
} from '../handlers/localstorage/walletNames';
import { web3Provider } from '../handlers/web3';
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

// -- Constants --------------------------------------- //
const WALLETS_UPDATE = 'wallets/ALL_WALLETS_UPDATE';
const WALLETS_LOAD = 'wallets/ALL_WALLETS_LOAD';
const WALLETS_SET_SELECTED = 'wallets/SET_SELECTED';
const WALLETS_ADDED_ACCOUNT = 'wallets/WALLETS_ADDED_ACCOUNT';
const WALLETS_UPDATE_NAMES = 'wallets/WALLETS_UPDATE_NAMES';

// -- Actions ---------------------------------------- //
export const walletsLoadState = () => async (dispatch, getState) => {
  try {
    const { accountAddress } = getState().settings;
    let addressFromKeychain = accountAddress;
    const { wallets } = await getAllWallets();
    const selected = await getSelectedWallet();
    // Prevent irrecoverable state (no selected wallet)
    let selectedWallet = get(selected, 'wallet', undefined);
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

    dispatch({
      payload: {
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
  selected: undefined,
  walletNames: {},
  wallets: null,
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
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
