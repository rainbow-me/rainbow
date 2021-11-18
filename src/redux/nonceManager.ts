import {
  getNonceManager,
  saveNonceManager,
} from '../handlers/localstorage/nonceManager';
import { AppDispatch, AppGetState } from './store';
import {
  EthereumAddress,
  NonceManager,
  NonceManagerUpdate,
} from '@rainbow-me/entities';
import { Network } from '@rainbow-me/helpers/networkTypes';
import logger from 'logger';

interface NonceManagerLoadSuccessAction {
  type: typeof NONCE_MANAGER_LOAD_SUCCESS;
  payload: NonceManager;
}

interface NonceManagerUpdateNonceAction {
  type: typeof NONCE_MANAGER_UPDATE_NONCE;
  payload: NonceManagerUpdate;
}

type NonceManagerActionType =
  | NonceManagerLoadSuccessAction
  | NonceManagerUpdateNonceAction;

// -- Constants --------------------------------------- //
const NONCE_MANAGER_LOAD_SUCCESS = 'NONCE_MANAGER_LOAD_SUCCESS';
const NONCE_MANAGER_LOAD_FAILURE = 'NONCE_MANAGER_LOAD_FAILURE';
const NONCE_MANAGER_UPDATE_NONCE = 'NONCE_MANAGER_UPDATE_NONCE';

// -- Helpers --------------------------------------- //
const getCurrentNonce = (
  getState: AppGetState,
  params: NonceManagerUpdate
): [number, NonceManager] => {
  const { nonceManager } = getState();
  const { accountAddress, network } = params;
  let currentNonceData: NonceManager = { ...nonceManager };
  const currentNonce =
    currentNonceData[accountAddress.toLowerCase()]?.[network]?.nonce;
  return [currentNonce, currentNonceData];
};

const updateNonce = (nonceData: NonceManager, params: NonceManagerUpdate) => (
  dispatch: AppDispatch
) => {
  const { accountAddress, network, nonce } = params;
  const lcAccountAddress = accountAddress.toLowerCase();
  dispatch({
    payload: { ...params, accountAddress: lcAccountAddress },
    type: NONCE_MANAGER_UPDATE_NONCE,
  });
  saveNonceManager({
    ...nonceData,
    [lcAccountAddress]: {
      ...(nonceData[lcAccountAddress] || {}),
      [network]: { nonce },
    },
  });
};

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

export const incrementNonce = (
  accountAddress: EthereumAddress,
  nonce: number,
  network = Network.mainnet
) => (dispatch: AppDispatch, getState: AppGetState) => {
  const nonceParams = {
    accountAddress,
    network,
    nonce,
  };
  const [currentNonce, currentNonceData] = getCurrentNonce(
    getState,
    nonceParams
  );
  const nonceCounterExists = !!currentNonce;
  const counterShouldBeIncremented = currentNonce < nonce;

  if (!nonceCounterExists || counterShouldBeIncremented) {
    logger.log('Incrementing nonce: ', nonceParams, currentNonce);
    dispatch(updateNonce(currentNonceData, nonceParams));
  }
};

export const decrementNonce = (
  accountAddress: EthereumAddress,
  nonce: number,
  network = Network.mainnet
) => (dispatch: AppDispatch, getState: AppGetState) => {
  let [currentNonce, currentNonceData] = getCurrentNonce(getState, {
    accountAddress,
    network,
    nonce,
  });
  const nonceCounterExists = !!currentNonce;
  const counterShouldBeDecremented = currentNonce >= nonce;

  if (!nonceCounterExists || counterShouldBeDecremented) {
    const decrementedNonce = nonce - 1;
    const nonceParams = {
      accountAddress,
      network,
      nonce: decrementedNonce,
    };
    logger.log('Decrementing nonce: ', nonceParams);
    dispatch(updateNonce(currentNonceData, nonceParams));
  }
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
        [action.payload.accountAddress]: {
          ...state[action.payload.accountAddress],
          [action.payload.network]: {
            nonce: action.payload.nonce,
          },
        },
      };
    default:
      return state;
  }
};
