import produce from 'immer';

// -- Constants --------------------------------------- //
const SET_IS_COIN_LIST_EDITED = 'editOptions/SET_IS_COIN_LIST_EDITED';
const CLEAR_SELECTED_COINS = 'editOptions/SET_IS_COIN_LIST_EDITED';
const PUSH_SELECTED_COIN = 'editOptions/SET_IS_COIN_LIST_EDITED';

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
  isCoinListEdited: false,
  selectedCoins: [],
};

export default (state = INITIAL_STATE, action) =>
  produce(state, draft => {
    if (action.type === SET_IS_COIN_LIST_EDITED) {
      draft.isCoinListEdited = action.payload;
    } else if (action.type === CLEAR_SELECTED_COINS) {
      draft.selectedCoins = [];
    } else if (action.type === PUSH_SELECTED_COIN) {
      draft.selectedCoins = draft.selectedCoins.push(action.payload);
    }
  });
