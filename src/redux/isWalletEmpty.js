import produce from 'immer';

// -- Constants --------------------------------------- //
const SET_IS_WALLET_EMPTY = 'isWalletEmpty/SET_IS_WALLET_EMPTY';

export const setIsWalletEmpty = payload => dispatch => dispatch({
  payload,
  type: SET_IS_WALLET_EMPTY,
});

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = { isWalletEmpty: true };

export default (state = INITIAL_STATE, action) => produce(state, draft => {
  if (action.type === SET_IS_WALLET_EMPTY) {
    draft.isWalletEmpty = action.payload;
  }
});
