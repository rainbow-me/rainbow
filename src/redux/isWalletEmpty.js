import produce from 'immer';
import { isNull } from 'lodash';
import {
  getIsWalletEmpty,
  removeIsWalletEmpty,
  saveIsWalletEmpty,
} from '../handlers/commonStorage';

// -- Constants --------------------------------------- //
const SET_IS_WALLET_EMPTY = 'isWalletEmpty/SET_IS_WALLET_EMPTY';
const CLEAR_IS_WALLET_EMPTY = 'isWalletEmpty/CLEAR_IS_WALLET_EMPTY';

export const loadIsWalletEmpty = () => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  const isWalletEmpty = getIsWalletEmpty(accountAddress, network);
  if (!isNull(isWalletEmpty)) {
    dispatch({
      payload: isWalletEmpty,
      type: SET_IS_WALLET_EMPTY,
    });
  }
};

export const setIsWalletEmpty = payload => (dispatch, getState) => {
  dispatch({
    payload,
    type: SET_IS_WALLET_EMPTY,
  });
  const { accountAddress, network } = getState().settings;
  saveIsWalletEmpty(accountAddress, payload, network);
};

export const clearIsWalletEmpty = () => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  removeIsWalletEmpty(accountAddress, network);
  dispatch({ type: CLEAR_IS_WALLET_EMPTY });
};


// -- Reducer ----------------------------------------- //
const INITIAL_STATE = { isWalletEmpty: true };

export default (state = INITIAL_STATE, action) => (
  produce(state, draft => {
    switch (action.type) {
    case SET_IS_WALLET_EMPTY:
      draft.isWalletEmpty = action.payload;
      break;
    case CLEAR_IS_WALLET_EMPTY:
      return INITIAL_STATE;
    default:
      break;
    }
  })
);
