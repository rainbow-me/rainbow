// -- Constants --------------------------------------- //
const NONCE_UPDATE_TRANSACTION_COUNT_NONCE = 'nonce/NONCE_UPDATE_TRANSACTION_COUNT_NONCE';

export const updateTransactionCountNonce = (transactionCount) => (dispatch, getState) => {
  const { transactionCountNonce } = getState().nonce;
  if (transactionCount > transactionCountNonce) {
    dispatch({ payload: transactionCount, type: NONCE_UPDATE_TRANSACTION_COUNT_NONCE });
  }
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  transactionCountNonce: 0,
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
  case NONCE_UPDATE_TRANSACTION_COUNT_NONCE:
    return { ...state, transactionCountNonce: action.payload };
  default:
    return state;
  }
};
