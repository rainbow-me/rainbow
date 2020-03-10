import produce from 'immer';
import {
  getHiddenCoins,
  getPinnedCoins,
  savePinnedCoins,
  saveHiddenCoins,
} from '../handlers/localstorage/accountLocal';
import { union, without, difference } from 'lodash';

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
const CLEAR_COINS = 'editOptions/CLEAR_COINS';

// -- Actions --------------------------------------------------------------- //
export const coinListLoadState = () => async (dispatch, getState) => {
  try {
    const { accountAddress, network } = getState().settings;
    const hiddenCoins = await getHiddenCoins(accountAddress, network);
    const pinnedCoins = await getPinnedCoins(accountAddress, network);
    console.log('load: ', pinnedCoins);
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

export const setPinnedCoins = () => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  dispatch({
    accountAddress,
    network,
    type: SET_PINNED_COINS,
  });
};

export const setHiddenCoins = () => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  dispatch({
    accountAddress,
    network,
    type: SET_HIDDEN_COINS,
  });
};

export const clearHiddenAndPinnedCoins = () => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  dispatch({
    accountAddress,
    network,
    type: CLEAR_COINS,
  });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  currentAction: 'none',
  hiddenCoins: [],
  isCoinListEdited: false,
  pinnedCoins: [],
  selectedCoins: [],
  wasRecentlyPinned: false,
};

// GOT TO CLEAN THAT ONE UP FROM REDUNDANT CODE
export default (state = INITIAL_STATE, action) =>
  produce(state, draft => {
    if (action.type === COIN_LIST_OPTIONS_LOAD_SUCCESS) {
      draft.pinnedCoins = action.payload.pinnedCoins || [];
      draft.hiddenCoins = action.payload.hiddenCoins || [];
    } else if (action.type === SET_IS_COIN_LIST_EDITED) {
      draft.isCoinListEdited = action.payload;
      if (!draft.isCoinListEdited) {
        draft.selectedCoins = [];
      }
    } else if (action.type === CLEAR_SELECTED_COINS) {
      draft.selectedCoins = [];
    } else if (
      action.type === PUSH_SELECTED_COIN ||
      action.type === REMOVE_SELECTED_COIN
    ) {
      if (action.type === PUSH_SELECTED_COIN) {
        draft.selectedCoins.push(action.payload);
      }

      if (action.type === REMOVE_SELECTED_COIN) {
        draft.selectedCoins.splice(
          draft.selectedCoins.indexOf(action.payload),
          1
        );
      }
      if (draft.selectedCoins.length == 0) {
        draft.currentAction = 'none';
      } else if (
        draft.selectedCoins.length > 0 &&
        difference(draft.hiddenCoins, draft.selectedCoins).length ===
          draft.hiddenCoins.length - draft.selectedCoins.length
      ) {
        draft.currentAction = 'unhide';
      } else if (
        draft.selectedCoins.length > 0 &&
        difference(draft.pinnedCoins, draft.selectedCoins).length ===
          draft.pinnedCoins.length - draft.selectedCoins.length
      ) {
        draft.currentAction = 'unpin';
      } else {
        draft.currentAction = 'standard';
      }
    } else if (action.type === SET_PINNED_COINS) {
      if (
        draft.currentAction === 'standard' ||
        draft.currentAction === 'unhide'
      ) {
        draft.hiddenCoins = without(draft.hiddenCoins, ...draft.selectedCoins);
        saveHiddenCoins(
          draft.hiddenCoins,
          action.accountAddress,
          action.network
        );
        draft.pinnedCoins = union(draft.selectedCoins, draft.pinnedCoins);
      } else if (draft.currentAction === 'unpin') {
        draft.pinnedCoins = without(draft.pinnedCoins, ...draft.selectedCoins);
      }
      draft.currentAction = 'standard';
      savePinnedCoins(draft.pinnedCoins, action.accountAddress, action.network);
      draft.selectedCoins = [];
      draft.currentAction = 'none';
      draft.wasRecentlyPinned = !draft.wasRecentlyPinned;
    } else if (action.type === SET_HIDDEN_COINS) {
      if (
        draft.currentAction === 'standard' ||
        draft.currentAction === 'unpin'
      ) {
        draft.pinnedCoins = without(draft.pinnedCoins, ...draft.selectedCoins);
        savePinnedCoins(
          draft.pinnedCoins,
          action.accountAddress,
          action.network
        );
        draft.hiddenCoins = union(draft.selectedCoins, draft.hiddenCoins);
      } else if (draft.currentAction === 'unhide') {
        draft.hiddenCoins = without(draft.hiddenCoins, ...draft.selectedCoins);
      }
      draft.currentAction = 'standard';
      saveHiddenCoins(draft.hiddenCoins, action.accountAddress, action.network);
      draft.selectedCoins = [];
      draft.currentAction = 'none';
      draft.wasRecentlyPinned = !draft.wasRecentlyPinned;
    } else if (action.type === CLEAR_COINS) {
      draft.selectedCoins = [];
      draft.hiddenCoins = [];
      draft.pinnedCoins = [];
    }
  });
