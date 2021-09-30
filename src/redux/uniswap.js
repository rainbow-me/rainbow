import produce from 'immer';
import { concat, isArray, map, remove, toLower, uniq, without } from 'lodash';
import {
  getUniswapFavorites,
  saveUniswapFavorites,
} from '@rainbow-me/handlers/localstorage/uniswap';
import {
  getAllTokens,
  getTestnetUniswapPairs,
} from '@rainbow-me/handlers/uniswap';
import networkTypes from '@rainbow-me/networkTypes';
import {
  CURATED_UNISWAP_TOKENS,
  DefaultUniswapFavorites,
  RAINBOW_TOKEN_LIST,
  SOCKS_ADDRESS,
} from '@rainbow-me/references';
import { greaterThanOrEqualTo, multiply } from '@rainbow-me/utilities';
import { checkTokenIsScam, getTokenMetadata } from '@rainbow-me/utils';

// -- Constants ------------------------------------------------------------- //
const UNISWAP_LOAD_REQUEST = 'uniswap/UNISWAP_LOAD_REQUEST';
const UNISWAP_LOAD_SUCCESS = 'uniswap/UNISWAP_LOAD_SUCCESS';
const UNISWAP_LOAD_FAILURE = 'uniswap/UNISWAP_LOAD_FAILURE';

const UNISWAP_UPDATE_PAIRS = 'uniswap/UNISWAP_UPDATE_PAIRS';
const UNISWAP_UPDATE_ALL_TOKENS = 'uniswap/UNISWAP_UPDATE_ALL_TOKENS';
const UNISWAP_LOADED_ALL_TOKENS = 'uniswap/UNISWAP_LOADED_ALL_TOKENS';

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
  if (network === networkTypes.mainnet) {
    getAllTokens();
  }
};

const parseTokens = tokens => {
  let parsedTokens = {};
  tokens.forEach(token => {
    const tokenAddress = toLower(token?.id);
    const metadata = getTokenMetadata(tokenAddress);
    if (token.totalLiquidity === '0' || token.derivedETH === '0') return;

    // if unverified AND name/symbol match a curated token, skip
    if (!metadata?.isVerified && checkTokenIsScam(token.name, token.symbol)) {
      return;
    }

    const highLiquidity =
      token.derivedETH &&
      greaterThanOrEqualTo(
        multiply(token.derivedETH, token.totalLiquidity),
        0.5
      );

    const tokenInfo = {
      address: tokenAddress,
      decimals: Number(token.decimals),
      highLiquidity,
      name: token.name,
      symbol: token.symbol,
      totalLiquidity: Number(token.totalLiquidity),
      uniqueId: tokenAddress,
      ...metadata,
    };
    parsedTokens[tokenAddress] = tokenInfo;
  });
  return parsedTokens;
};

export const uniswapUpdateTokens = tokens => (dispatch, getState) => {
  const { allTokens } = getState().uniswap;
  const parsedTokens = parseTokens(tokens);

  const updatedTokens = {
    ...allTokens,
    ...parsedTokens,
  };
  dispatch({
    payload: updatedTokens,
    type: UNISWAP_UPDATE_ALL_TOKENS,
  });
};

export const uniswapLoadedAllTokens = () => dispatch =>
  dispatch({
    type: UNISWAP_LOADED_ALL_TOKENS,
  });

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
  const { favorites } = getState().uniswap;
  const normalizedFavorites = map(favorites, toLower);

  const updatedFavorites = add
    ? uniq(concat(normalizedFavorites, assetAddress))
    : isArray(assetAddress)
    ? without(normalizedFavorites, ...assetAddress)
    : without(normalizedFavorites, assetAddress);
  dispatch({
    payload: updatedFavorites,
    type: UNISWAP_UPDATE_FAVORITES,
  });
  saveUniswapFavorites(updatedFavorites);
};

// -- Reducer --------------------------------------------------------------- //
export const INITIAL_UNISWAP_STATE = {
  allTokens: RAINBOW_TOKEN_LIST,
  favorites: DefaultUniswapFavorites['mainnet'],
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
        break;
      case UNISWAP_LOADED_ALL_TOKENS:
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
