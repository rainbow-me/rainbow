import {
  generateAccount,
  getAllWallets,
  getSelectedWallet,
  saveAddress,
  saveAllWallets,
  setSelectedWallet,
} from '../model/wallet';
import { colors } from '../styles';

// -- Constants --------------------------------------- //
const WALLETS_UPDATE = 'wallets/ALL_WALLETS_UPDATE';
const WALLETS_LOAD = 'wallets/ALL_WALLETS_LOAD';
const WALLETS_SET_SELECTED = 'wallets/SET_SELECTED';
const WALLETS_ADDED_ACCOUNT = 'wallets/WALLETS_ADDED_ACCOUNT';

// -- Actions ---------------------------------------- //
export const walletsLoadState = () => async dispatch => {
  try {
    const { wallets } = await getAllWallets();
    const selected = await getSelectedWallet();

    dispatch({
      payload: {
        selected: selected.wallet,
        wallets,
      },
      type: WALLETS_LOAD,
    });
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
export const addressSetSelected = address => () => {
  saveAddress(address);
};

export const createAccountForWallet = id => async (dispatch, getState) => {
  const { wallets } = getState().wallets;
  let index = 0;
  wallets[id].addresses.forEach(
    account => (index = Math.max(index, account.index))
  );
  const newIndex = index + 1;
  const account = await generateAccount(id, newIndex);
  wallets[id].addresses.push({
    address: account.address,
    color: colors.getRandomColor(),
    index: newIndex,
    label: '',
    visible: true,
  });

  // Save all the wallets
  saveAllWallets(wallets);
  // Set the address selected (KEYCHAIN)
  await saveAddress(account.address);
  // Set the wallet selected (REDUX)
  await setSelectedWallet(wallets[id]);

  dispatch({
    payload: { selected: wallets[id], wallets },
    type: WALLETS_ADDED_ACCOUNT,
  });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  selected: undefined,
  wallets: null,
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case WALLETS_SET_SELECTED:
      return { ...state, selected: action.payload };
    case WALLETS_UPDATE:
      return { ...state, wallets: action.payload };
    case WALLETS_LOAD:
      return {
        ...state,
        selected: action.payload.selected,
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
