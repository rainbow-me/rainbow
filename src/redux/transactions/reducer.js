import actions from './actions';

const initialState = {
  fetching: false,
  transactionsToApprove: [],
};

export default function reducer(state = initialState, action) {
  const { payload = {}, type } = action;

  switch (type) {
  case actions.WALLETCONNECT_UPDATE_TRANSACTIONS_TO_APPROVE:
    return {
      ...state,
      transactionsToApprove: payload,
    };
  default:
    return state;
  }
}
