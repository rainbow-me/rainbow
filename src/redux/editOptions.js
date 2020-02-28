import produce from 'immer';
import {
  getHiddenCoins,
  getPinnedCoins,
} from '../handlers/localstorage/accountLocal';

// -- Constants --------------------------------------- //
const COIN_LIST_OPTIONS_LOAD_SUCCESS =
  'editOptions/COIN_LIST_OPTIONS_LOAD_SUCCESS';
const COIN_LIST_OPTIONS_LOAD_FAILURE =
  'editOptions/COIN_LIST_OPTIONS_LOAD_FAILURE';

const SET_IS_COIN_LIST_EDITED = 'editOptions/SET_IS_COIN_LIST_EDITED';
const CLEAR_SELECTED_COINS = 'editOptions/SET_IS_COIN_LIST_EDITED';
const PUSH_SELECTED_COIN = 'editOptions/SET_IS_COIN_LIST_EDITED';

// -- Actions --------------------------------------------------------------- //
export const coinListLoadState = () => async (dispatch, getState) => {
  try {
    const { accountAddress, network } = getState().settings;
    const pinnedCoins = await getPinnedCoins(accountAddress, network);
    const hiddenCoins = await getHiddenCoins(accountAddress, network);
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

export const pushSelectedCoins = payload => dispatch => {
  dispatch({
    payload,
    type: PUSH_SELECTED_COIN,
  });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  hiddenCoins: [],
  isCoinListEdited: false,
  pinnedCoins: ['eth'],
  selectedCoins: [],
};

export default (state = INITIAL_STATE, action) =>
  produce(state, draft => {
    if (action.type === COIN_LIST_OPTIONS_LOAD_SUCCESS) {
      // draft.pinnedCoins = action.payload.pinnedCoins;
      // draft.hiddenCoins = action.payload.hiddenCoins;
    } else if (action.type === SET_IS_COIN_LIST_EDITED) {
      draft.isCoinListEdited = action.payload;
    } else if (action.type === CLEAR_SELECTED_COINS) {
      draft.selectedCoins = [];
    } else if (action.type === PUSH_SELECTED_COIN) {
      draft.selectedCoins = draft.selectedCoins.push(action.payload);
    }
  });
