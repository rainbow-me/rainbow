import { isFuture } from 'date-fns';
import { omitBy, pickBy } from 'lodash';

// -- Constants --------------------------------------- //
const WALLETCONNECT_NEW_SESSION = 'walletconnect/WALLETCONNECT_NEW_SESSION';

export const addWalletConnector = (walletConnector) => (dispatch, getState) => {
  if (walletConnector) {
    const { walletConnectors } = getState().walletconnect;
    const updatedWalletConnectors = { ...walletConnectors, [walletConnector.sessionId]: walletConnector };
    dispatch({ payload: updatedWalletConnectors, type: WALLETCONNECT_NEW_SESSION });
  }
};

export const getValidWalletConnectors = () => (dispatch, getState) => {
  const { walletConnectors } = getState().walletconnect;
  const validConnectors = pickBy(walletConnectors, ({ expires }) => isFuture(expires));
  dispatch({ payload: validConnectors, type: WALLETCONNECT_NEW_SESSION });
  return validConnectors;
};

export const removeWalletConnectorByDapp = (dappName) => (dispatch, getState) => {
  const { walletConnectors } = getState().walletconnect;
  dispatch({
    payload: omitBy(walletConnectors, ({ dappName: _dappName }) => (_dappName === dappName)),
    type: WALLETCONNECT_NEW_SESSION,
  });
};

export const setWalletConnectors = (walletConnectors) => (dispatch) => dispatch({
  payload: walletConnectors, type: WALLETCONNECT_NEW_SESSION,
});

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  walletConnectors: {},
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
  case WALLETCONNECT_NEW_SESSION:
    return { ...state, walletConnectors: action.payload };
  default:
    return state;
  }
};
