import produce from 'immer';
import { concat, toLower, without } from 'lodash';
import { getPreference } from '../model/preferences';
import {
  getShowcaseTokens,
  getWebDataEnabled,
  saveShowcaseTokens,
  saveWebDataEnabled,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/localstor... Remove this comment to see the full error message
} from '@rainbow-me/handlers/localstorage/accountLocal';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/networkTyp... Remove this comment to see the full error message
import networkTypes from '@rainbow-me/helpers/networkTypes';

// -- Constants --------------------------------------- //
const SHOWCASE_TOKENS_LOAD_SUCCESS =
  'showcaseTokens/SHOWCASE_TOKENS_LOAD_SUCCESS';
const SHOWCASE_TOKENS_LOAD_FAILURE =
  'showcaseTokens/SHOWCASE_TOKENS_LOAD_FAILURE';
const UPDATE_WEB_DATA_ENABLED = 'showcaseTokens/UPDATE_WEB_DATA_ENABLED';
const ADD_SHOWCASE_TOKEN = 'showcaseTokens/ADD_SHOWCASE_TOKEN';
const REMOVE_SHOWCASE_TOKEN = 'showcaseTokens/REMOVE_SHOWCASE_TOKEN';

export const showcaseTokensLoadState = () => async (
  dispatch: any,
  getState: any
) => {
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
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'showcase' does not exist on type 'Object... Remove this comment to see the full error message
        showcaseTokensFromCloud?.showcase?.ids &&
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'showcase' does not exist on type 'Object... Remove this comment to see the full error message
        showcaseTokensFromCloud?.showcase?.ids.length > 0
      ) {
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'showcase' does not exist on type 'Object... Remove this comment to see the full error message
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

export const addShowcaseToken = (tokenId: any) => (
  dispatch: any,
  getState: any
) => {
  const { accountAddress, network } = getState().settings;
  const { showcaseTokens } = getState().showcaseTokens;
  const updatedShowcaseTokens = concat(showcaseTokens, tokenId);
  dispatch({
    payload: updatedShowcaseTokens,
    type: ADD_SHOWCASE_TOKEN,
  });
  saveShowcaseTokens(updatedShowcaseTokens, accountAddress, network);
};

export const removeShowcaseToken = (tokenId: any) => (
  dispatch: any,
  getState: any
) => {
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
  enabled: any,
  address: any,
  network = networkTypes.mainnet
) => async (dispatch: any) => {
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

export default (state = INITIAL_STATE, action: any) =>
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
