import produce from 'immer';

// -- Constants --------------------------------------- //
const SET_IS_WALLET_IMPORTING = 'isWalletImporting/SET_IS_WALLET_IMPORTING';

export const setIsWalletImporting = payload => dispatch => (
  dispatch({
    payload,
    type: SET_IS_WALLET_IMPORTING,
  })
);

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = { isImporting: false };

export default (state = INITIAL_STATE, action) => (
  produce(state, draft => {
    if (action.type === SET_IS_WALLET_IMPORTING) {
      draft.isImporting = action.payload;
    }
  })
);
