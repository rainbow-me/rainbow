import produce from 'immer';
import { remove } from 'lodash';
import {
  getShowcaseTokens,
  saveShowcaseTokens,
} from '../handlers/localstorage/accountLocal';

// -- Constants --------------------------------------- //
const SHOWCASE_TOKENS_LOAD_SUCCESS =
  'showcaseTokens/SHOWCASE_TOKENS_LOAD_SUCCESS';
const SHOWCASE_TOKENS_LOAD_FAILURE =
  'showcaseTokens/SHOWCASE_TOKENS_LOAD_FAILURE';

const PUSH_SHOWCASE_TOKEN = 'showcaseTokens/PUSH_SHOWCASE_TOKEN';
const POP_SHOWCASE_TOKEN = 'showcaseTokens/POP_SHOWCASE_TOKEN';

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

export const pushShowcaseToken = payload => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  dispatch({
    payload: {
      accountAddress,
      network,
      uniqueId: payload,
    },
    type: PUSH_SHOWCASE_TOKEN,
  });
};

export const popShowcaseToken = payload => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  dispatch({
    payload: {
      accountAddress,
      network,
      uniqueId: payload,
    },
    type: POP_SHOWCASE_TOKEN,
  });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  showcaseTokens: [],
};

export default (state = INITIAL_STATE, action) =>
  produce(state, draft => {
    if (action.type === PUSH_SHOWCASE_TOKEN) {
      draft.showcaseTokens.push(action.payload.uniqueId);
      saveShowcaseTokens(
        draft.showcaseTokens,
        action.payload.accountAddress,
        action.payload.network
      );
    } else if (action.type === POP_SHOWCASE_TOKEN) {
      remove(draft.showcaseTokens, token => {
        return token === action.payload.uniqueId;
      });
      saveShowcaseTokens(
        draft.showcaseTokens,
        action.payload.accountAddress,
        action.payload.network
      );
    } else if (action.type === SHOWCASE_TOKENS_LOAD_SUCCESS) {
      draft.showcaseTokens = action.payload.length > 0 ? action.payload : [];
    }
  });
