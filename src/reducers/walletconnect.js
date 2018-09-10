// -- Constants --------------------------------------- //
const WALLETCONNECT_NEW_SESSION = 'walletconnect/WALLETCONNECT_NEW_SESSION';

export const addWalletConnector = (sessionId, walletConnector) => (dispatch, getState) => {
  // TODO
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  fetching: false,
  walletConnectors: {},
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case WALLETCONNECT_NEW_SESSION:
      return {
        ...state,
        walletConnectors: action.payload,
      };
    default:
      return state;
  }
};
