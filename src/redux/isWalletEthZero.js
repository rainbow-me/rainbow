import produce from 'immer';

// -- Constants --------------------------------------- //
const SET_IS_WALLET_ETH_ZERO = 'isWalletEthZero/SET_IS_WALLET_ETH_ZERO';

export const setIsWalletEthZero = payload => dispatch => (
  dispatch({
    payload,
    type: SET_IS_WALLET_ETH_ZERO,
  })
);

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = { isWalletEthZero: true };

export default (state = INITIAL_STATE, action) => (
  produce(state, draft => {
    if (action.type === SET_IS_WALLET_ETH_ZERO) {
      draft.isWalletEthZero = action.payload;
    }
  })
);
