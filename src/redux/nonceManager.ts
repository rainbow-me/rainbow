import { isNil } from 'lodash';
import { AppDispatch, AppGetState } from './store';
import { EthereumAddress, NonceManager } from '@/entities';
import { getNonceManager, saveNonceManager } from '@/handlers/localstorage/nonceManager';
import { Network } from '@/helpers/networkTypes';
import logger from '@/utils/logger';

interface NonceManagerLoadSuccessAction {
  type: typeof NONCE_MANAGER_LOAD_SUCCESS;
  payload: NonceManager;
}

interface NonceManagerUpdateNonceAction {
  type: typeof NONCE_MANAGER_UPDATE_NONCE;
  payload: NonceManager;
}

type NonceManagerActionType = NonceManagerLoadSuccessAction | NonceManagerUpdateNonceAction;

// -- Constants --------------------------------------- //
const NONCE_MANAGER_LOAD_SUCCESS = 'NONCE_MANAGER_LOAD_SUCCESS';
const NONCE_MANAGER_LOAD_FAILURE = 'NONCE_MANAGER_LOAD_FAILURE';
const NONCE_MANAGER_UPDATE_NONCE = 'NONCE_MANAGER_UPDATE_NONCE';

// -- Actions ---------------------------------------- //
export const nonceManagerLoadState = () => async (dispatch: AppDispatch) => {
  try {
    const nonceManager = await getNonceManager();
    if (nonceManager) {
      dispatch({
        payload: nonceManager,
        type: NONCE_MANAGER_LOAD_SUCCESS,
      });
    }
  } catch (error) {
    dispatch({ type: NONCE_MANAGER_LOAD_FAILURE });
  }
};

export const incrementNonce = (accountAddress: EthereumAddress, nonce: number, network = Network.mainnet) => (dispatch: AppDispatch) =>
  dispatch(updateNonce(accountAddress, nonce, network));

export const decrementNonce = (accountAddress: EthereumAddress, nonce: number, network = Network.mainnet) => (dispatch: AppDispatch) =>
  dispatch(updateNonce(accountAddress, nonce, network, false));

export const updateNonce = (accountAddress: EthereumAddress, nonce: number, network = Network.mainnet, increment: boolean = true) => (
  dispatch: AppDispatch,
  getState: AppGetState
) => {
  const { nonceManager: currentNonceData } = getState();
  const currentNonce = currentNonceData[accountAddress.toLowerCase()]?.[network]?.nonce;
  const counterShouldBeUpdated = isNil(currentNonce) || (increment ? currentNonce < nonce : currentNonce >= nonce);

  if (counterShouldBeUpdated) {
    const newNonce = increment ? nonce : nonce - 1;
    logger.log('Updating nonce: ', accountAddress, network, newNonce);

    const lcAccountAddress = accountAddress.toLowerCase();
    const updatedNonceManager = {
      ...currentNonceData,
      [lcAccountAddress]: {
        ...(currentNonceData[lcAccountAddress] || {}),
        [network]: { nonce: newNonce },
      },
    };
    dispatch({
      payload: updatedNonceManager,
      type: NONCE_MANAGER_UPDATE_NONCE,
    });
    saveNonceManager(updatedNonceManager);
  }
};
export const resetNonces = (accountAddress: EthereumAddress) => async (dispatch: AppDispatch, getState: AppGetState) => {
  const { nonceManager: currentNonceData } = getState();

  const currentAccountAddress = accountAddress.toLowerCase();

  const updatedNonceManager: NonceManager = {
    ...currentNonceData,
    [currentAccountAddress]: {},
  };

  dispatch({
    payload: updatedNonceManager,
    type: NONCE_MANAGER_UPDATE_NONCE,
  });
  saveNonceManager(updatedNonceManager);
};
// -- Reducer ----------------------------------------- //
const INITIAL_STATE: NonceManager = {};

export default (state = INITIAL_STATE, action: NonceManagerActionType) => {
  switch (action.type) {
    case NONCE_MANAGER_LOAD_SUCCESS:
      return {
        ...state,
        ...action.payload,
      };
    case NONCE_MANAGER_UPDATE_NONCE:
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
};
