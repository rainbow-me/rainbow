import produce from 'immer';
import {
  getHiddenCoins,
  getPinnedCoins,
} from '../handlers/localstorage/accountLocal';
import { union } from 'lodash';

// -- Constants --------------------------------------- //
const COIN_LIST_OPTIONS_LOAD_SUCCESS =
  'editOptions/COIN_LIST_OPTIONS_LOAD_SUCCESS';
const COIN_LIST_OPTIONS_LOAD_FAILURE =
  'editOptions/COIN_LIST_OPTIONS_LOAD_FAILURE';

const SET_IS_COIN_LIST_EDITED = 'editOptions/SET_IS_COIN_LIST_EDITED';
const SET_PINNED_COINS = 'editOptions/SET_PINNED_COINS';
const SET_HIDDEN_COINS = 'editOptions/SET_HIDDEN_COINS';
const CLEAR_SELECTED_COINS = 'editOptions/CLEAR_SELECTED_COINS';
const PUSH_SELECTED_COIN = 'editOptions/PUSH_SELECTED_COIN';
const REMOVE_SELECTED_COIN = 'editOptions/REMOVE_SELECTED_COIN';

// -- Actions --------------------------------------------------------------- //
export const coinListLoadState = () => async (dispatch, getState) => {
  try {
    const { accountAddress, network } = getState().settings;
    const hiddenCoins = await getHiddenCoins(accountAddress, network);
    const pinnedCoins = await getPinnedCoins(accountAddress, network);
    dispatch({
      payload: {
        hiddenCoins,
        pinnedCoins,
      },
      type: COIN_LIST_OPTIONS_LOAD_SUCCESS,
    });
  } catch (error) {
    dispatch({ type: COIN_LIST_OPTIONS_LOAD_FAILURE });
  }
};

export const setIsCoinListEdited = payload => dispatch => {
  dispatch({
    payload,
    type: SET_IS_COIN_LIST_EDITED,
  });
};

export const clearSelectedCoins = payload => dispatch => {
  dispatch({
    payload,
    type: CLEAR_SELECTED_COINS,
  });
};

export const pushSelectedCoin = payload => dispatch => {
  dispatch({
    payload,
    type: PUSH_SELECTED_COIN,
  });
};

export const removeSelectedCoin = payload => dispatch => {
  dispatch({
    payload,
    type: REMOVE_SELECTED_COIN,
  });
};

export const setPinnedCoins = () => dispatch => {
  dispatch({
    type: SET_PINNED_COINS,
  });
};

export const setHiddenCoins = () => dispatch => {
  dispatch({
    type: SET_HIDDEN_COINS,
  });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  hiddenCoins: [],
  isCoinListEdited: false,
  pinnedCoins: [],
  selectedCoins: [],
  wasRecentlyPinned: false,
};

export default (state = INITIAL_STATE, action) =>
  produce(state, draft => {
    if (action.type === COIN_LIST_OPTIONS_LOAD_SUCCESS) {
      // draft.pinnedCoins = action.payload.pinnedCoins || [];
      // draft.hiddenCoins = action.payload.hiddenCoins || [];
    } else if (action.type === SET_IS_COIN_LIST_EDITED) {
      draft.isCoinListEdited = action.payload;
      if (!draft.isCoinListEdited) {
        draft.selectedCoins = [];
      }
    } else if (action.type === CLEAR_SELECTED_COINS) {
      draft.selectedCoins = [];
    } else if (action.type === PUSH_SELECTED_COIN) {
      if (draft.wasRecentlyPinned) {
        draft.wasRecentlyPinned = false;
      }
      draft.selectedCoins.push(action.payload);
    } else if (action.type === REMOVE_SELECTED_COIN) {
      draft.selectedCoins.splice(
        draft.selectedCoins.indexOf(action.payload),
        1
      );
    } else if (action.type === SET_PINNED_COINS) {
      draft.pinnedCoins = union(draft.selectedCoins, draft.pinnedCoins);
      draft.selectedCoins = [];
      draft.wasRecentlyPinned = true;
    } else if (action.type === SET_HIDDEN_COINS) {
      draft.hiddenCoins = union(draft.selectedCoins, draft.hiddenCoins);
      draft.selectedCoins = [];
      draft.wasRecentlyPinned = true;
    }
  });
