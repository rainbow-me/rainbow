import produce from 'immer';
import { concat, isArray, map, remove, toLower, uniq, without } from 'lodash';
import {
  getUniswapFavorites,
  saveUniswapFavorites,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/localstor... Remove this comment to see the full error message
} from '@rainbow-me/handlers/localstorage/uniswap';
import {
  getAllTokens,
  getTestnetUniswapPairs,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/uniswap' ... Remove this comment to see the full error message
} from '@rainbow-me/handlers/uniswap';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/networkTypes' or i... Remove this comment to see the full error message
import networkTypes from '@rainbow-me/networkTypes';
import {
  DefaultUniswapFavorites,
  rainbowTokenList,
  SOCKS_ADDRESS,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
} from '@rainbow-me/references';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utilities' or its ... Remove this comment to see the full error message
import { greaterThanOrEqualTo, multiply } from '@rainbow-me/utilities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
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
export const uniswapLoadState = () => async (dispatch: any, getState: any) => {
  const { network } = getState().settings;
  dispatch({ type: UNISWAP_LOAD_REQUEST });
  try {
    const favorites = await getUniswapFavorites(network);
    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'unknown' is not assignable to pa... Remove this comment to see the full error message
    remove(favorites, address => toLower(address) === toLower(SOCKS_ADDRESS));
    dispatch({
      payload: favorites,
      type: UNISWAP_LOAD_SUCCESS,
    });
  } catch (error) {
    dispatch({ type: UNISWAP_LOAD_FAILURE });
  }
};

export const uniswapGetAllExchanges = () => async (
  dispatch: any,
  getState: any
) => {
  const { network } = getState().settings;
  if (network === networkTypes.mainnet) {
    getAllTokens();
  }
};

const parseTokens = (tokens: any) => {
  let parsedTokens = {};
  tokens.forEach((token: any) => {
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
    // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    parsedTokens[tokenAddress] = tokenInfo;
  });
  return parsedTokens;
};

export const uniswapUpdateTokens = (tokens: any) => (
  dispatch: any,
  getState: any
) => {
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

export const uniswapLoadedAllTokens = () => (dispatch: any) =>
  dispatch({
    type: UNISWAP_LOADED_ALL_TOKENS,
  });

export const uniswapPairsInit = () => (dispatch: any, getState: any) => {
  const { network } = getState().settings;
  const pairs =
    network === networkTypes.mainnet
      ? rainbowTokenList.CURATED_TOKENS
      : getTestnetUniswapPairs(network);
  dispatch({
    payload: pairs,
    type: UNISWAP_UPDATE_PAIRS,
  });
};

export const uniswapResetState = () => (dispatch: any) =>
  dispatch({ type: UNISWAP_CLEAR_STATE });

export const uniswapUpdateFavorites = (assetAddress: any, add = true) => (
  dispatch: any,
  getState: any
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
  get allTokens() {
    return rainbowTokenList.RAINBOW_TOKEN_LIST;
  },
  favorites: DefaultUniswapFavorites['mainnet'],
  fetchingUniswap: false,
  loadingAllTokens: true,
  loadingUniswap: false,
  get pairs() {
    return rainbowTokenList.CURATED_TOKENS;
  },
};

export default (state = INITIAL_UNISWAP_STATE, action: any) =>
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
