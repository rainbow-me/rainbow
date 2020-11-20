import produce from 'immer';
import {
  concat,
  filter,
  keys,
  map,
  remove,
  toLower,
  uniq,
  without,
} from 'lodash';
import {
  getUniswapFavorites,
  saveUniswapFavorites,
} from '../handlers/localstorage/uniswap';
import { getAllTokens, getTestnetUniswapPairs } from '../handlers/uniswap';
import networkTypes from '../helpers/networkTypes';
import { DefaultUniswapFavorites, SOCKS_ADDRESS } from '../references';
import { CURATED_UNISWAP_TOKENS } from '../references/uniswap';

// -- Constants ------------------------------------------------------------- //
const UNISWAP_LOAD_REQUEST = 'uniswap/UNISWAP_LOAD_REQUEST';
const UNISWAP_LOAD_SUCCESS = 'uniswap/UNISWAP_LOAD_SUCCESS';
const UNISWAP_LOAD_FAILURE = 'uniswap/UNISWAP_LOAD_FAILURE';

const UNISWAP_UPDATE_PAIRS = 'uniswap/UNISWAP_UPDATE_PAIRS';
const UNISWAP_UPDATE_ALL_TOKENS = 'uniswap/UNISWAP_UPDATE_ALL_TOKENS';

const UNISWAP_UPDATE_FAVORITES = 'uniswap/UNISWAP_UPDATE_FAVORITES';
const UNISWAP_CLEAR_STATE = 'uniswap/UNISWAP_CLEAR_STATE';

// -- Actions --------------------------------------------------------------- //
export const uniswapLoadState = () => async (dispatch, getState) => {
  const { network } = getState().settings;
  dispatch({ type: UNISWAP_LOAD_REQUEST });
  try {
    const favorites = await getUniswapFavorites(network);
    remove(favorites, address => toLower(address) === toLower(SOCKS_ADDRESS));
    dispatch({
      payload: favorites,
      type: UNISWAP_LOAD_SUCCESS,
    });
  } catch (error) {
    dispatch({ type: UNISWAP_LOAD_FAILURE });
  }
};

export const uniswapGetAllExchanges = () => async (dispatch, getState) => {
  const { network } = getState().settings;
  const { pairs } = getState().uniswap;
  try {
    const ignoredTokens = filter(keys(pairs), x => x !== 'eth');
    const allTokens =
      network === networkTypes.mainnet ? await getAllTokens(ignoredTokens) : {};
    dispatch({
      payload: allTokens,
      type: UNISWAP_UPDATE_ALL_TOKENS,
    });
  } catch (error) {
    dispatch({
      payload: {},
      type: UNISWAP_UPDATE_ALL_TOKENS,
    });
  }
};

export const uniswapPairsInit = () => (dispatch, getState) => {
  const { network } = getState().settings;
  const pairs =
    network === networkTypes.mainnet
      ? CURATED_UNISWAP_TOKENS
      : getTestnetUniswapPairs(network);
  dispatch({
    payload: pairs,
    type: UNISWAP_UPDATE_PAIRS,
  });
};

export const uniswapResetState = () => dispatch =>
  dispatch({ type: UNISWAP_CLEAR_STATE });

export const uniswapUpdateFavorites = (assetAddress, add = true) => (
  dispatch,
  getState
) => {
  const address = toLower(assetAddress);
  const { favorites } = getState().uniswap;
  const normalizedFavorites = map(favorites, toLower);

  const updatedFavorites = add
    ? uniq(concat(normalizedFavorites, address))
    : without(normalizedFavorites, address);
  dispatch({
    payload: updatedFavorites,
    type: UNISWAP_UPDATE_FAVORITES,
  });
  saveUniswapFavorites(updatedFavorites);
};

// -- Reducer --------------------------------------------------------------- //
export const INITIAL_UNISWAP_STATE = {
  allTokens: {},
  favorites: DefaultUniswapFavorites,
  fetchingUniswap: false,
  loadingAllTokens: true,
  loadingUniswap: false,
  pairs: CURATED_UNISWAP_TOKENS,
};

export default (state = INITIAL_UNISWAP_STATE, action) =>
  produce(state, draft => {
    switch (action.type) {
      case UNISWAP_LOAD_REQUEST:
        draft.loadingUniswap = true;
        break;
      case UNISWAP_UPDATE_ALL_TOKENS:
        draft.allTokens = action.payload;
        draft.loadingAllTokens = false;
        break;
      case UNISWAP_UPDATE_PAIRS:
        draft.pairs = action.payload;
        break;
      case UNISWAP_LOAD_SUCCESS:
        draft.favorites = action.payload;
        draft.loadingUniswap = false;
        break;
      case UNISWAP_UPDATE_FAVORITES:
        draft.favorites = action.payload;
        break;
      case UNISWAP_LOAD_FAILURE:
        draft.loadingUniswap = false;
        break;
      case UNISWAP_CLEAR_STATE:
        return INITIAL_UNISWAP_STATE;
      default:
        break;
    }
  });
