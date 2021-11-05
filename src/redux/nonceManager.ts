import {
  getNonceManager,
  saveNonceManager,
} from '../handlers/localstorage/nonceManager';
import { AppDispatch, AppGetState } from './store';

type NetworkId = string;
type AccountId = string;

interface NetworkNonceInfo {
  nonce: number;
}
interface AccountNonceInfo {
  [key: NetworkId]: NetworkNonceInfo;
}

interface NonceManager {
  [key: AccountId]: AccountNonceInfo;
}

interface NonceManagerUpdate {
  network: NetworkId;
  account: AccountId;
  nonce: number;
}

interface NonceManagerLoadSuccessAction {
  type: typeof NONCE_MANAGER_LOAD_SUCCESS;
  payload: NonceManager;
}

interface NonceManagerUpdateDataAction {
  type: typeof NONCE_MANAGER_UPDATE_DATA;
  payload: NonceManagerUpdate;
}

export type NonceManagerActionType =
  | NonceManagerLoadSuccessAction
  | NonceManagerUpdateDataAction;

// -- Constants --------------------------------------- //
const NONCE_MANAGER_LOAD_SUCCESS = 'NONCE_MANAGER_LOAD_SUCCESS';
const NONCE_MANAGER_LOAD_FAILURE = 'NONCE_MANAGER_LOAD_FAILURE';
const NONCE_MANAGER_UPDATE_DATA = 'NONCE_MANAGER_UPDATE_DATA';

// -- Actions ---------------------------------------- //
export const getNonceManagerState = () => async (dispatch: AppDispatch) => {
  try {
    const nonceManager = await getNonceManager();
    dispatch({
      payload: nonceManager,
      type: NONCE_MANAGER_LOAD_SUCCESS,
    });
  } catch (error) {
    dispatch({ type: NONCE_MANAGER_LOAD_FAILURE });
  }
};

export const updateNonceManager = (
  account: string,
  network: string,
  nonce: number
) => (dispatch: AppDispatch, getState: AppGetState) => {
  const { nonceManager } = getState();
  const updatedNonceManager: NonceManager = { ...nonceManager };
  updatedNonceManager[account][network]['nonce'] = nonce;
  dispatch({
    payload: { account, network, nonce },
    type: NONCE_MANAGER_UPDATE_DATA,
  });
  saveNonceManager(updatedNonceManager);
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
    case NONCE_MANAGER_UPDATE_DATA:
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
