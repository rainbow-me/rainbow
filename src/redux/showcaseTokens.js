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
  showcaseTokens: [
    '0x06012c8cf97bead5deae237070f9587f8e7a266d_1368227',
    '0xcfbc9103362aec4ce3089f155c2da2eea1cb7602_8372',
    '0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85_114250019769840285307462738976463004196063698158466201044175195562450754683663',
    '0x06012c8cf97bead5deae237070f9587f8e7a266d_1115873',
  ],
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
