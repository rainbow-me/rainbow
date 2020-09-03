import produce from 'immer';
import {
  concat,
  filter,
  get,
  isEmpty,
  keys,
  map,
  toLower,
  uniq,
  uniqBy,
  without,
} from 'lodash';
import {
  getLiquidity,
  getUniswapFavorites,
  getUniswapLiquidityInfo,
  saveLiquidity,
  saveLiquidityInfo,
  saveUniswapFavorites,
} from '../handlers/localstorage/uniswap';
import {
  getAllTokens,
  getLiquidityInfo,
  getTestnetUniswapPairs,
} from '../handlers/uniswap';
import networkTypes from '../helpers/networkTypes';
import { DefaultUniswapFavorites, uniswapPairs } from '../references';

// -- Constants ------------------------------------------------------------- //
const UNISWAP_LOAD_REQUEST = 'uniswap/UNISWAP_LOAD_REQUEST';
const UNISWAP_LOAD_SUCCESS = 'uniswap/UNISWAP_LOAD_SUCCESS';
const UNISWAP_LOAD_FAILURE = 'uniswap/UNISWAP_LOAD_FAILURE';

const UNISWAP_LOAD_LIQUIDITY_TOKEN_INFO_SUCCESS =
  'uniswap/UNISWAP_LOAD_LIQUIDITY_TOKEN_INFO_SUCCESS';

const UNISWAP_UPDATE_PAIRS = 'uniswap/UNISWAP_UPDATE_PAIRS';
const UNISWAP_UPDATE_ALL_TOKENS = 'uniswap/UNISWAP_UPDATE_ALL_TOKENS';

const UNISWAP_UPDATE_REQUEST = 'uniswap/UNISWAP_UPDATE_REQUEST';
const UNISWAP_UPDATE_SUCCESS = 'uniswap/UNISWAP_UPDATE_SUCCESS';
const UNISWAP_UPDATE_FAILURE = 'uniswap/UNISWAP_UPDATE_FAILURE';

const UNISWAP_UPDATE_FAVORITES = 'uniswap/UNISWAP_UPDATE_FAVORITES';
const UNISWAP_UPDATE_LIQUIDITY_TOKENS =
  'uniswap/UNISWAP_UPDATE_LIQUIDITY_TOKENS';
const UNISWAP_CLEAR_STATE = 'uniswap/UNISWAP_CLEAR_STATE';

// -- Actions --------------------------------------------------------------- //
const hasTokenQuantity = token => token.quantity > 0;
const getAssetCode = token => get(token, 'asset.asset_code');

export const uniswapLoadState = () => async (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  dispatch({ type: UNISWAP_LOAD_REQUEST });
  try {
    const uniswapLiquidityTokenInfo = await getUniswapLiquidityInfo(
      accountAddress,
      network
    );
    dispatch({
      payload: uniswapLiquidityTokenInfo,
      type: UNISWAP_LOAD_LIQUIDITY_TOKEN_INFO_SUCCESS,
    });
    const favorites = await getUniswapFavorites(network);
    const liquidityTokens = await getLiquidity(accountAddress, network);
    dispatch({
      payload: {
        favorites,
        liquidityTokens,
      },
      type: UNISWAP_LOAD_SUCCESS,
    });
  } catch (error) {
    dispatch({ type: UNISWAP_LOAD_FAILURE });
  }
};

export const uniswapGetAllExchanges = () => async (dispatch, getState) => {
  const { tokenOverrides } = getState().data;
  const { network } = getState().settings;
  const { pairs } = getState().uniswap;
  try {
    const ignoredTokens = filter(keys(pairs), x => x !== 'eth');
    const allTokens =
      network === networkTypes.mainnet
        ? await getAllTokens(tokenOverrides, ignoredTokens)
        : {};
    dispatch({
      payload: allTokens,
      type: UNISWAP_UPDATE_ALL_TOKENS,
    });
  } catch (error) {
    dispatch({
      payload: { allTokens: {} },
      type: UNISWAP_UPDATE_ALL_TOKENS,
    });
  }
};

export const uniswapPairsInit = () => (dispatch, getState) => {
  const { network } = getState().settings;
  const pairs =
    network === networkTypes.mainnet
      ? uniswapPairs
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

export const uniswapUpdateLiquidityTokens = (
  liquidityTokens,
  appendOrChange
) => (dispatch, getState) => {
  if (isEmpty(liquidityTokens)) return;
  let updatedLiquidityTokens = filter(liquidityTokens, hasTokenQuantity);
  if (appendOrChange) {
    const { liquidityTokens: existingLiquidityTokens } = getState().uniswap;
    updatedLiquidityTokens = uniqBy(
      concat(updatedLiquidityTokens, existingLiquidityTokens),
      getAssetCode
    );
  }
  const { accountAddress, network } = getState().settings;
  dispatch({
    payload: updatedLiquidityTokens,
    type: UNISWAP_UPDATE_LIQUIDITY_TOKENS,
  });
  saveLiquidity(updatedLiquidityTokens, accountAddress, network);
  dispatch(uniswapUpdateState());
};

export const uniswapUpdateState = () => (dispatch, getState) =>
  new Promise((resolve, promiseReject) => {
    const { accountAddress, network } = getState().settings;
    const { liquidityTokens, pairs } = getState().uniswap;

    if (isEmpty(liquidityTokens)) {
      return resolve(false);
    }

    dispatch({ type: UNISWAP_UPDATE_REQUEST });

    const exchangeContracts = map(liquidityTokens, getAssetCode);
    return getLiquidityInfo(accountAddress, exchangeContracts, pairs)
      .then(liquidityInfo => {
        saveLiquidityInfo(liquidityInfo, accountAddress, network);
        dispatch({
          payload: liquidityInfo,
          type: UNISWAP_UPDATE_SUCCESS,
        });
        resolve(true);
      })
      .catch(error => {
        dispatch({ type: UNISWAP_UPDATE_FAILURE });
        promiseReject(error);
      });
  });

// -- Reducer --------------------------------------------------------------- //
export const INITIAL_UNISWAP_STATE = {
  allTokens: {},
  favorites: DefaultUniswapFavorites,
  fetchingUniswap: false,
  isInitialized: false,
  liquidityTokens: [],
  loadingUniswap: false,
  pairs: uniswapPairs,
  uniswapLiquidityTokenInfo: {},
};

export default (state = INITIAL_UNISWAP_STATE, action) =>
  produce(state, draft => {
    switch (action.type) {
      case UNISWAP_LOAD_REQUEST:
        draft.loadingUniswap = true;
        break;
      case UNISWAP_LOAD_LIQUIDITY_TOKEN_INFO_SUCCESS:
        draft.uniswapLiquidityTokenInfo = action.payload;
        break;
      case UNISWAP_UPDATE_ALL_TOKENS:
        draft.allTokens = action.payload;
        draft.isInitialized = true;
        break;
      case UNISWAP_UPDATE_PAIRS:
        draft.pairs = action.payload;
        break;
      case UNISWAP_LOAD_SUCCESS:
        draft.favorites = action.payload.favorites;
        draft.liquidityTokens = action.payload.liquidityTokens;
        draft.loadingUniswap = false;
        break;
      case UNISWAP_UPDATE_FAVORITES:
        draft.favorites = action.payload;
        break;
      case UNISWAP_LOAD_FAILURE:
        draft.loadingUniswap = false;
        break;
      case UNISWAP_UPDATE_REQUEST:
        draft.fetchingUniswap = true;
        break;
      case UNISWAP_UPDATE_SUCCESS:
        draft.fetchingUniswap = false;
        draft.uniswapLiquidityTokenInfo = action.payload;
        break;
      case UNISWAP_UPDATE_FAILURE:
        draft.fetchingUniswap = false;
        break;
      case UNISWAP_UPDATE_LIQUIDITY_TOKENS:
        draft.liquidityTokens = action.payload;
        break;
      case UNISWAP_CLEAR_STATE:
        return INITIAL_UNISWAP_STATE;
      default:
        break;
    }
  });
