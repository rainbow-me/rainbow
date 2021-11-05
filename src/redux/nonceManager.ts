import {
  getNonceManager,
  saveNonceManager,
} from '../handlers/localstorage/nonceManager';
import { AppDispatch, AppGetState } from './store';
import { Network } from '@rainbow-me/helpers/networkTypes';

interface NetworkNonceInfo {
  nonce: number;
}
interface AccountNonceInfo {
  [key: string]: NetworkNonceInfo;
}

interface NonceManager {
  [key: string]: AccountNonceInfo;
}

interface NonceManagerUpdate {
  network: string;
  account: string;
  nonce: number;
}

interface NonceManagerLoadSuccessAction {
  type: typeof NONCE_MANAGER_LOAD_SUCCESS;
  payload: NonceManager;
}

interface NonceManagerUpdateNonceAction {
  type: typeof NONCE_MANAGER_UPDATE_NONCE;
  payload: NonceManagerUpdate;
}

export type NonceManagerActionType =
  | NonceManagerLoadSuccessAction
  | NonceManagerUpdateNonceAction;

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

export const incrementNonceManager = (
  account: string,
  nonce: number,
  network?: string
) => (dispatch: AppDispatch, getState: AppGetState) => {
  const { nonceManager } = getState();
  let updatedNonceManager: NonceManager = { ...nonceManager };
  const ntwrk = network || Network.mainnet;
  const txNonce = updatedNonceManager[account]?.[ntwrk]?.nonce;

  if (!txNonce || txNonce < nonce) {
    updatedNonceManager = {
      ...updatedNonceManager,
      [account]: {
        ...(updatedNonceManager[account] || {}),
        [ntwrk]: {
          nonce,
        },
      },
    };
    dispatch({
      payload: { account, network, nonce },
      type: NONCE_MANAGER_UPDATE_NONCE,
    });
    saveNonceManager(updatedNonceManager);
  }
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {};

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
        [action.payload.account]: {
          [action.payload.network]: {
            nonce: action.payload.nonce,
          },
        },
      };
    default:
      return state;
  }
};
