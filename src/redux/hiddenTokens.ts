import { concat, without } from 'lodash';
import { Dispatch } from 'redux';
import { getPreference } from '../model/preferences';
import { AppGetState } from './store';
import {
  getHiddenTokens,
  getWebDataEnabled,
  saveHiddenTokens,
} from '@/handlers/localstorage/accountLocal';
import WalletTypes from '@/utils/walletTypes';

const HIDDEN_TOKENS_LOAD_SUCCESS = 'hiddenTokens/HIDDEN_TOKENS_LOAD_SUCCESS';
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
  payload: string[];
}

/**
 * Loads hidden token IDs and web-data settings from local storage and
 * updates state.
 */
export const hiddenTokensLoadState = () => async (
  dispatch: Dispatch<
    HiddenTokensLoadSuccessAction | HiddenTokensLoadFailureAction
  >,
  getState: AppGetState
) => {
  try {
    const account = getState().wallets?.selected;
    const isReadOnlyWallet = account?.type === WalletTypes.readOnly;
    const { accountAddress, network } = getState().settings;

    let hiddenTokens = await getHiddenTokens(accountAddress, network);

    // if web data is enabled, fetch values from cloud
    const pref = await getWebDataEnabled(accountAddress, network);

    if ((!isReadOnlyWallet && pref) || isReadOnlyWallet) {
      const hiddenTokensFromCloud = (await getPreference(
        'hidden',
        accountAddress
      )) as any | undefined;
      if (
        hiddenTokensFromCloud?.hidden?.ids &&
        hiddenTokensFromCloud?.hidden?.ids.length > 0
      ) {
        hiddenTokens = hiddenTokensFromCloud.hidden.ids;
      }
    }

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
 * Adds a token ID to the hidden in state and updates local storage.
 *
 * @param tokenId The new token ID.
 */
export const addHiddenToken = (tokenId: string) => (
  dispatch: Dispatch<HiddenTokensUpdateAction>,
  getState: AppGetState
) => {
  const account = getState().wallets.selected!;

  if (account.type === WalletTypes.readOnly) return;

  const { accountAddress, network } = getState().settings;
  const { hiddenTokens } = getState().hiddenTokens;
  const updatedHiddenTokens = concat(hiddenTokens, tokenId);
  dispatch({
    payload: updatedHiddenTokens,
    type: HIDDEN_TOKENS_UPDATE,
  });
  saveHiddenTokens(updatedHiddenTokens, accountAddress, network);
};

/**
 * Removes a token ID from the hidden in state and updates local storage.
 *
 * @param tokenId The token ID to remove.
 */
export const removeHiddenToken = (tokenId: string) => (
  dispatch: Dispatch<HiddenTokensUpdateAction>,
  getState: AppGetState
) => {
  const account = getState().wallets.selected!;

  if (account.type === WalletTypes.readOnly) return;

  const { accountAddress, network } = getState().settings;
  const { hiddenTokens } = getState().hiddenTokens;

  const updatedHiddenTokens = without(hiddenTokens, tokenId);

  dispatch({
    payload: updatedHiddenTokens,
    type: HIDDEN_TOKENS_UPDATE,
  });

  saveHiddenTokens(updatedHiddenTokens, accountAddress, network);
};

const INITIAL_STATE: HiddenTokensState = {
  hiddenTokens: [],
};

export default (
  state: HiddenTokensState = INITIAL_STATE,
  action: HiddenTokensAction
): HiddenTokensState => {
  switch (action.type) {
    case HIDDEN_TOKENS_LOAD_SUCCESS:
      return action.payload;
    case HIDDEN_TOKENS_UPDATE:
      return {
        hiddenTokens: action.payload,
      };
    default:
      return state;
  }
};
