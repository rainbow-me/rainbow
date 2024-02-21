import { concat, without } from 'lodash';
import { Dispatch } from 'redux';
import { getPreference } from '../model/preferences';
import { AppGetState } from './store';
import { getHiddenTokens, getWebDataEnabled, saveHiddenTokens } from '@/handlers/localstorage/accountLocal';
import WalletTypes from '@/helpers/walletTypes';

const HIDDEN_TOKENS_LOAD_SUCCESS = 'hiddenTokens/HIDDEN_TOKENS_LOAD_SUCCESS';
const HIDDEN_TOKENS_FETCH_SUCCESS = 'hiddenTokens/HIDDEN_TOKENS_FETCH_SUCCESS';
const HIDDEN_TOKENS_FETCH_FAILURE = 'hiddenTokens/HIDDEN_TOKENS_FETCH_FAILURE';
const HIDDEN_TOKENS_LOAD_FAILURE = 'hiddenTokens/HIDDEN_TOKENS_LOAD_FAILURE';
const HIDDEN_TOKENS_UPDATE = 'hiddenTokens/UPDATE_HIDDEN_TOKENS';

/**
 * Represents the state for the `hiddenTokens` reducer.
 */
interface HiddenTokensState {
  /**
   * The current array of hidden token IDs.
   */
  hiddenTokens: string[];
}

/**
 * An action for the `hiddenTokens` reducer.
 */
type HiddenTokensAction =
  | HiddenTokensLoadSuccessAction
  | HiddenTokensFetchSuccessAction
  | HiddenTokensFetchFailureAction
  | HiddenTokensLoadFailureAction
  | HiddenTokensUpdateAction;

/**
 * The action used when information about hidden tokens has been loaded
 * successfully.
 */
interface HiddenTokensLoadSuccessAction {
  type: typeof HIDDEN_TOKENS_LOAD_SUCCESS;
  payload: {
    hiddenTokens: string[];
  };
}

/**
 * The action used when information about hidden tokens has been loaded from firebase
 * successfully.
 */
interface HiddenTokensFetchSuccessAction {
  type: typeof HIDDEN_TOKENS_FETCH_SUCCESS;
  payload: {
    hiddenTokens: string[];
  };
}

/**
 * The action used when loading information about hidden tokens from firebase fails.
 */
interface HiddenTokensFetchFailureAction {
  type: typeof HIDDEN_TOKENS_FETCH_FAILURE;
}

/**
 * The action used when loading information about hidden tokens fails.
 */
interface HiddenTokensLoadFailureAction {
  type: typeof HIDDEN_TOKENS_LOAD_FAILURE;
}

/**
 * The action for updating hidden token IDs.
 */
interface HiddenTokensUpdateAction {
  type: typeof HIDDEN_TOKENS_UPDATE;
  payload: {
    hiddenTokens: string[];
  };
}

/**
 * Loads hidden token IDs and web-data settings from local storage and
 * updates state.
 */
export const hiddenTokensLoadState =
  () => async (dispatch: Dispatch<HiddenTokensLoadSuccessAction | HiddenTokensLoadFailureAction>, getState: AppGetState) => {
    try {
      const { accountAddress, network } = getState().settings;

      const hiddenTokens = await getHiddenTokens(accountAddress, network);

      dispatch({
        payload: {
          hiddenTokens,
        },
        type: HIDDEN_TOKENS_LOAD_SUCCESS,
      });
    } catch (error) {
      dispatch({ type: HIDDEN_TOKENS_LOAD_FAILURE });
    }
  };

/**
 * Loads hidden token IDs and web-data settings from firebase and
 * updates state.
 */
export const hiddenTokensUpdateStateFromWeb =
  () => async (dispatch: Dispatch<HiddenTokensFetchSuccessAction | HiddenTokensFetchFailureAction>, getState: AppGetState) => {
    try {
      const isReadOnlyWallet = getState().wallets.selected?.type === WalletTypes.readOnly;
      const { accountAddress, network } = getState().settings;

      // if web data is enabled, fetch values from cloud
      const pref = await getWebDataEnabled(accountAddress, network);

      if ((!isReadOnlyWallet && pref) || isReadOnlyWallet) {
        const hiddenTokensFromCloud = (await getPreference('hidden', accountAddress)) as any | undefined;
        if (hiddenTokensFromCloud?.hidden?.ids && hiddenTokensFromCloud?.hidden?.ids.length > 0) {
          dispatch({
            payload: {
              hiddenTokens: hiddenTokensFromCloud?.hidden?.ids,
            },
            type: HIDDEN_TOKENS_FETCH_SUCCESS,
          });
        }
      }
    } catch (e) {
      dispatch({ type: HIDDEN_TOKENS_FETCH_FAILURE });
    }
  };

/**
 * Adds a token ID to the hidden in state and updates local storage.
 *
 * @param tokenId The new token ID.
 */
export const addHiddenToken = (tokenId: string) => (dispatch: Dispatch<HiddenTokensUpdateAction>, getState: AppGetState) => {
  const account = getState().wallets.selected!;

  if (account.type === WalletTypes.readOnly) return;

  const { accountAddress, network } = getState().settings;
  const { hiddenTokens } = getState().hiddenTokens;
  const updatedHiddenTokens = concat(hiddenTokens, tokenId);
  dispatch({
    payload: {
      hiddenTokens: updatedHiddenTokens,
    },
    type: HIDDEN_TOKENS_UPDATE,
  });
  saveHiddenTokens(updatedHiddenTokens, accountAddress, network);
};

/**
 * Removes a token ID from the hidden in state and updates local storage.
 *
 * @param tokenId The token ID to remove.
 */
export const removeHiddenToken = (tokenId: string) => (dispatch: Dispatch<HiddenTokensUpdateAction>, getState: AppGetState) => {
  const account = getState().wallets.selected!;

  if (account.type === WalletTypes.readOnly) return;

  const { accountAddress, network } = getState().settings;
  const { hiddenTokens } = getState().hiddenTokens;

  const updatedHiddenTokens = without(hiddenTokens, tokenId);

  dispatch({
    payload: { hiddenTokens: updatedHiddenTokens },
    type: HIDDEN_TOKENS_UPDATE,
  });

  saveHiddenTokens(updatedHiddenTokens, accountAddress, network);
};

const INITIAL_STATE: HiddenTokensState = {
  hiddenTokens: [],
};

export default (state: HiddenTokensState = INITIAL_STATE, action: HiddenTokensAction): HiddenTokensState => {
  switch (action.type) {
    case HIDDEN_TOKENS_LOAD_SUCCESS:
      return {
        hiddenTokens: action.payload.hiddenTokens,
      };
    case HIDDEN_TOKENS_FETCH_SUCCESS:
      return {
        hiddenTokens: action.payload.hiddenTokens,
      };
    case HIDDEN_TOKENS_UPDATE:
      return {
        hiddenTokens: action.payload.hiddenTokens,
      };
    default:
      return state;
  }
};
