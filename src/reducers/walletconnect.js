import { filter } from 'lodash';

// -- Constants --------------------------------------- //
const WALLETCONNECT_NEW_SESSION = 'walletconnect/WALLETCONNECT_NEW_SESSION';

export const setWalletConnectors = (walletConnectors) => (dispatch, getState) => {
  dispatch({ type: WALLETCONNECT_NEW_SESSION, payload: walletConnectors });
};

export const addWalletConnector = (walletConnector) => (dispatch, getState) => {
  if (walletConnector) {
    const { walletConnectors } = getState().walletconnect;
    const updatedWalletConnectors = { ...walletConnectors, [walletConnector.sessionId]: walletConnector };
    dispatch({ type: WALLETCONNECT_NEW_SESSION, payload: updatedWalletConnectors });
  }
};

export const getValidWalletConnectors = () => (dispatch, getState) => {
  console.log('get valid wallet connectors');
  const { walletConnectors } = getState().walletconnect;
  console.log('walletConnectors from state', walletConnectors);
  const validConnectors = filter(walletConnectors, (walletConnector) => { return (new Date(walletConnector.expires) > new Date()) });
  console.log('valid connectors', validConnectors);
  dispatch({ type: WALLETCONNECT_NEW_SESSION, payload: validConnectors });
  return validConnectors;
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
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
