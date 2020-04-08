import { remove } from 'lodash';
import produce from 'immer';
import { getShowcaseTokens } from '../handlers/localstorage/accountLocal';

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

export const pushShowcaseToken = payload => dispatch =>
  dispatch({
    payload,
    type: PUSH_SHOWCASE_TOKEN,
  });

export const popShowcaseToken = payload => dispatch =>
  dispatch({
    payload,
    type: POP_SHOWCASE_TOKEN,
  });

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  showcaseTokens: [],
};

export default (state = INITIAL_STATE, action) =>
  produce(state, draft => {
    if (action.type === PUSH_SHOWCASE_TOKEN) {
      draft.showcaseTokens.push(action.payload);
    } else if (action.type === POP_SHOWCASE_TOKEN) {
      remove(draft.showcaseTokens, token => {
        return token === action.payload;
      });
    }
  });
