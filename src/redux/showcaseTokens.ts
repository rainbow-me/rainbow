import produce from 'immer';
import { concat, toLower, without } from 'lodash';
import { Dispatch } from 'redux';
import { getPreference } from '../model/preferences';
import { AppGetState } from './store';
import {
  getShowcaseTokens,
  getWebDataEnabled,
  saveShowcaseTokens,
  saveWebDataEnabled,
} from '@rainbow-me/handlers/localstorage/accountLocal';
import networkTypes from '@rainbow-me/helpers/networkTypes';

// -- Constants --------------------------------------- //

const SHOWCASE_TOKENS_LOAD_SUCCESS =
  'showcaseTokens/SHOWCASE_TOKENS_LOAD_SUCCESS';
const SHOWCASE_TOKENS_LOAD_FAILURE =
  'showcaseTokens/SHOWCASE_TOKENS_LOAD_FAILURE';
const UPDATE_WEB_DATA_ENABLED = 'showcaseTokens/UPDATE_WEB_DATA_ENABLED';
const SHOWCASE_TOKENS_UPDATE = 'showcaseTokens/UPDATE_SHOWCASE_TOKENS';

// -- Actions --------------------------------------------------------------- //

/**
 * Represents the state for the `showcaseTokens` reducer.
 */
interface ShowcaseTokensState {
  /**
   * The current array of showcased token IDs.
   */
  showcaseTokens: string[];

  /**
   * Whether or not web data is enabled for the user.
   */
  webDataEnabled: boolean;
}

/**
 * An action for the `showcaseTokens` reducer.
 */
type ShowcaseTokensAction =
  | ShowcaseTokensLoadSuccessAction
  | ShowcaseTokensLoadFailureAction
  | ShowcaseTokensUpdateWebDataEnabledAction
  | ShowcaseTokensUpdateAction;

/**
 * The action used when information about showcased tokens has been loaded
 * successfully.
 */
interface ShowcaseTokensLoadSuccessAction {
  type: typeof SHOWCASE_TOKENS_LOAD_SUCCESS;
  payload: {
    showcaseTokens: string[];
    webDataEnabled: boolean;
  };
}

/**
 * The action used when loading information about showcased tokens fails.
 */
interface ShowcaseTokensLoadFailureAction {
  type: typeof SHOWCASE_TOKENS_LOAD_FAILURE;
}

/**
 * The action for updating whether or not web data is enabled.
 */
interface ShowcaseTokensUpdateWebDataEnabledAction {
  type: typeof UPDATE_WEB_DATA_ENABLED;
  payload: boolean;
}

/**
 * The action for updating showcased token IDs.
 */
interface ShowcaseTokensUpdateAction {
  type: typeof SHOWCASE_TOKENS_UPDATE;
  payload: string[];
}

/**
 * Loads showcased token IDs and web-data settings from local storage and
 * updates state.
 */
export const showcaseTokensLoadState = () => async (
  dispatch: Dispatch<
    ShowcaseTokensLoadSuccessAction | ShowcaseTokensLoadFailureAction
  >,
  getState: AppGetState
) => {
  try {
    const { accountAddress, network } = getState().settings;

    let showcaseTokens = await getShowcaseTokens(accountAddress, network);

    // if web data is enabled, fetch values from cloud
    const pref = await getWebDataEnabled(accountAddress, network);
    if (pref) {
      const showcaseTokensFromCloud = (await getPreference(
        'showcase',
        accountAddress
      )) as any | undefined;
      if (
        showcaseTokensFromCloud?.showcase?.ids &&
        showcaseTokensFromCloud?.showcase?.ids.length > 0
      ) {
        showcaseTokens = showcaseTokensFromCloud.showcase.ids;
      }
    }

    dispatch({
      payload: {
        showcaseTokens,
        webDataEnabled: !!pref,
      },
      type: SHOWCASE_TOKENS_LOAD_SUCCESS,
    });
  } catch (error) {
    dispatch({ type: SHOWCASE_TOKENS_LOAD_FAILURE });
  }
};

/**
 * Adds a token ID to the showcase in state and updates local storage.
 *
 * @param tokenId The new token ID.
 */
export const addShowcaseToken = (tokenId: string) => (
  dispatch: Dispatch<ShowcaseTokensUpdateAction>,
  getState: AppGetState
) => {
  const { accountAddress, network } = getState().settings;
  const { showcaseTokens } = getState().showcaseTokens;
  const updatedShowcaseTokens = concat(showcaseTokens, tokenId);
  dispatch({
    payload: updatedShowcaseTokens,
    type: SHOWCASE_TOKENS_UPDATE,
  });
  saveShowcaseTokens(updatedShowcaseTokens, accountAddress, network);
};

/**
 * Removes a token ID from the showcase in state and updates local storage.
 *
 * @param tokenId The token ID to remove.
 */
export const removeShowcaseToken = (tokenId: string) => (
  dispatch: Dispatch<ShowcaseTokensUpdateAction>,
  getState: AppGetState
) => {
  const { accountAddress, network } = getState().settings;
  const { showcaseTokens } = getState().showcaseTokens;

  const updatedShowcaseTokens = without(showcaseTokens, tokenId);

  dispatch({
    payload: updatedShowcaseTokens,
    type: SHOWCASE_TOKENS_UPDATE,
  });

  saveShowcaseTokens(updatedShowcaseTokens, accountAddress, network);
};

/**
 * Updates whether or not web data should be enabled in state and
 * local storage.
 *
 * @param enabled Whether or not web data should be enabled.
 * @param address The current user's address.
 * @param network The current network.
 */
export const updateWebDataEnabled = (
  enabled: boolean,
  address: string,
  network = networkTypes.mainnet
) => async (dispatch: Dispatch<ShowcaseTokensUpdateWebDataEnabledAction>) => {
  dispatch({
    payload: enabled,
    type: UPDATE_WEB_DATA_ENABLED,
  });
  await saveWebDataEnabled(enabled, toLower(address), network);
};

// -- Reducer ----------------------------------------- //

const INITIAL_STATE: ShowcaseTokensState = {
  showcaseTokens: [],
  webDataEnabled: false,
};

export default (
  state: ShowcaseTokensState = INITIAL_STATE,
  action: ShowcaseTokensAction
): ShowcaseTokensState =>
  produce(state, draft => {
    if (action.type === SHOWCASE_TOKENS_UPDATE) {
      draft.showcaseTokens = action.payload;
    } else if (action.type === SHOWCASE_TOKENS_LOAD_SUCCESS) {
      draft.showcaseTokens = action.payload.showcaseTokens;
      draft.webDataEnabled = action.payload.webDataEnabled;
    } else if (action.type === UPDATE_WEB_DATA_ENABLED) {
      draft.webDataEnabled = action.payload;
    }
  });
