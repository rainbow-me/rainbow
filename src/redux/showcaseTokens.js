import produce from 'immer';
import { concat, without } from 'lodash';
import {
  getShowcaseTokens,
  saveShowcaseTokens,
} from '../handlers/localstorage/accountLocal';

// -- Constants --------------------------------------- //
const SHOWCASE_TOKENS_LOAD_SUCCESS =
  'showcaseTokens/SHOWCASE_TOKENS_LOAD_SUCCESS';
const SHOWCASE_TOKENS_LOAD_FAILURE =
  'showcaseTokens/SHOWCASE_TOKENS_LOAD_FAILURE';

const ADD_SHOWCASE_TOKEN = 'showcaseTokens/ADD_SHOWCASE_TOKEN';
const REMOVE_SHOWCASE_TOKEN = 'showcaseTokens/REMOVE_SHOWCASE_TOKEN';

export const showcaseTokensLoadState = () => async (dispatch, getState) => {
  try {
    const { accountAddress, network } = getState().settings;
    const openSavings = await getShowcaseTokens(accountAddress, network);
    dispatch({
      payload: openSavings,
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

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  showcaseTokens: [],
};

export default (state = INITIAL_STATE, action) =>
  produce(state, draft => {
    if (action.type === ADD_SHOWCASE_TOKEN) {
      draft.showcaseTokens = action.payload;
    } else if (action.type === REMOVE_SHOWCASE_TOKEN) {
      draft.showcaseTokens = action.payload;
    } else if (action.type === SHOWCASE_TOKENS_LOAD_SUCCESS) {
      draft.showcaseTokens = action.payload;
    }
  });
