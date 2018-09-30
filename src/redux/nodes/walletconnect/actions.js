import { filter } from 'lodash';
import createActionCreator from '../../utilities/createActionCreator';

export const WALLETCONNECT_NEW_SESSION = 'walletconnect/WALLETCONNECT_NEW_SESSION';
export const setWalletConnectors = createActionCreator(WALLETCONNECT_NEW_SESSION);

export function addWalletConnector(walletConnector) {
  return (dispatch, getState) => {
    if (walletConnector) {
      const { walletConnectors } = getState().walletconnect;
      const updatedWalletConnectors = { ...walletConnectors, [walletConnector.sessionId]: walletConnector };

      dispatch(setWalletConnectors(updatedWalletConnectors));
    }
  };
}

export function getValidWalletConnectors() {
  return (dispatch, getState) => {
    console.log('get valid wallet connectors');
    const { walletConnectors } = getState().walletconnect;
    console.log('walletConnectors from state', walletConnectors);
    const validConnectors = filter(walletConnectors, (walletConnector) => { return (new Date(walletConnector.expires) > new Date()) });
    console.log('valid connectors', validConnectors);
    dispatch({ type: WALLETCONNECT_NEW_SESSION, payload: validConnectors });
    return validConnectors;
  }
};

export default {
  WALLETCONNECT_NEW_SESSION,
  setWalletConnectors,
}
