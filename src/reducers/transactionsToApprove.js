// -- Constants --------------------------------------- //
const WALLETCONNECT_UPDATE_TRANSACTIONS_TO_APPROVE = 'wallet/WALLETCONNECT_UPDATE_TRANSACTIONS_TO_APPROVE';

export const getTransactionToApprove = () => (dispatch, getState) => {
  const { transactionsToApprove } = getState().transactionsToApprove;
  const transaction = transactionsToApprove[0] || null;
  const remainingTransactions = transactionsToApprove.slice(1,);
  dispatch({ type: WALLETCONNECT_UPDATE_TRANSACTIONS_TO_APPROVE, payload: remainingTransactions });
  return transaction;
};

export const addTransactionToApprove = (transactionId, transactionPayload) => (dispatch, getState) => {
  const { transactionsToApprove } = getState().transactionsToApprove;
  const transaction = { transactionId, transactionPayload };
  const updatedTransactions = transactionsToApprove.concat(transaction);
  dispatch({ type: WALLETCONNECT_UPDATE_TRANSACTIONS_TO_APPROVE, payload: updatedTransactions });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  fetching: false,
  transactionsToApprove: [],
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case WALLETCONNECT_UPDATE_TRANSACTIONS_TO_APPROVE:
      return {
        ...state,
        transactionsToApprove: action.payload,
      };
    default:
      return state;
  }
};
