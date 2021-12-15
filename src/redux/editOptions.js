// TODO get rid of this redux state soon. Currently we use this in a few selectors

// -- Constants --------------------------------------- //
const SET_HIDDEN_COINS = 'editOptions/SET_HIDDEN_COINS';

// -- Actions --------------------------------------------------------------- //

export const setHiddenCoins = coins => dispatch => {
  dispatch({
    payload: coins,
    type: SET_HIDDEN_COINS,
  });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  hiddenCoins: [],
};

export default (state = INITIAL_STATE, action) => {
  if (action.type === SET_HIDDEN_COINS) {
    return {
      ...state,
      hiddenCoins: action.payload,
    };
  }
  return state;
};
