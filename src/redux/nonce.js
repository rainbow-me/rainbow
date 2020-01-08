// -- Constants --------------------------------------- //
const NONCE_UPDATE_TRANSACTION_COUNT_NONCE =
  'nonce/NONCE_UPDATE_TRANSACTION_COUNT_NONCE';
const NONCE_CLEAR_STATE = 'nonce/NONCE_CLEAR_STATE';

export const updateTransactionCountNonce = transactionCount => (
  dispatch,
  getState
) => {
  const { transactionCountNonce } = getState().nonce;
  if (transactionCount > transactionCountNonce) {
    dispatch({
      payload: transactionCount,
      type: NONCE_UPDATE_TRANSACTION_COUNT_NONCE,
    });
  }
};

export const nonceClearState = () => dispatch =>
  dispatch({ type: NONCE_CLEAR_STATE });

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  transactionCountNonce: 0,
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case NONCE_UPDATE_TRANSACTION_COUNT_NONCE:
      return { ...state, transactionCountNonce: action.payload };
    case NONCE_CLEAR_STATE:
      return { ...state, ...INITIAL_STATE };
    default:
      return state;
  }
};
