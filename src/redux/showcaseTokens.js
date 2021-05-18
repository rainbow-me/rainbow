import produce from 'immer';
import { concat, toLower, without } from 'lodash';
import { getPreference } from '../model/preferences';
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
const ADD_SHOWCASE_TOKEN = 'showcaseTokens/ADD_SHOWCASE_TOKEN';
const REMOVE_SHOWCASE_TOKEN = 'showcaseTokens/REMOVE_SHOWCASE_TOKEN';

export const showcaseTokensLoadState = () => async (dispatch, getState) => {
  try {
    const { accountAddress, network } = getState().settings;

    let showcaseTokens = await getShowcaseTokens(accountAddress, network);

    // if web data is enabled, fetch values from cloud
    const pref = await getWebDataEnabled(accountAddress, network);
    if (pref) {
      const showcaseTokensFromCloud = await getPreference(
        'showcase',
        accountAddress
      );
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

export const addShowcaseToken = tokenId => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  const { showcaseTokens } = getState().showcaseTokens;
  const updatedShowcaseTokens = concat(showcaseTokens, tokenId);
  dispatch({
    payload: updatedShowcaseTokens,
    type: ADD_SHOWCASE_TOKEN,
  });
  saveShowcaseTokens(updatedShowcaseTokens, accountAddress, network);
};

export const removeShowcaseToken = tokenId => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  const { showcaseTokens } = getState().showcaseTokens;

  const updatedShowcaseTokens = without(showcaseTokens, tokenId);

  dispatch({
    payload: updatedShowcaseTokens,
    type: REMOVE_SHOWCASE_TOKEN,
  });

  saveShowcaseTokens(updatedShowcaseTokens, accountAddress, network);
};

export const updateWebDataEnabled = (
  enabled,
  address,
  network = networkTypes.mainnet
) => async dispatch => {
  dispatch({
    payload: enabled,
    type: UPDATE_WEB_DATA_ENABLED,
  });
  await saveWebDataEnabled(enabled, toLower(address), network);
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  showcaseTokens: [],
  webDataEnabled: false,
};

export default (state = INITIAL_STATE, action) =>
  produce(state, draft => {
    if (action.type === ADD_SHOWCASE_TOKEN) {
      draft.showcaseTokens = action.payload;
    } else if (action.type === REMOVE_SHOWCASE_TOKEN) {
      draft.showcaseTokens = action.payload;
    } else if (action.type === SHOWCASE_TOKENS_LOAD_SUCCESS) {
      draft.showcaseTokens = action.payload.showcaseTokens;
      draft.webDataEnabled = action.payload.webDataEnabled;
    } else if (action.type === UPDATE_WEB_DATA_ENABLED) {
      draft.webDataEnabled = action.payload;
    }
  });
