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
  without,
} from 'lodash';
import {
  getAllowances,
  getLiquidity,
  getUniswapFavorites,
  getUniswapLiquidityInfo,
  removeUniswapStorage,
  saveAllowances,
  saveLiquidity,
  saveLiquidityInfo,
  saveUniswapFavorites,
} from '../handlers/localstorage/uniswap';
import {
  getAllExchanges,
  getLiquidityInfo,
  getReserve,
  getTestnetUniswapPairs,
  getUniswapPairs,
} from '../handlers/uniswap';
import networkTypes from '../helpers/networkTypes';
import {
  cleanUniswapAssetsFallback,
  DefaultUniswapFavorites,
} from '../references';

// -- Constants ------------------------------------------------------------- //
const UNISWAP_LOAD_REQUEST = 'uniswap/UNISWAP_LOAD_REQUEST';
const UNISWAP_LOAD_SUCCESS = 'uniswap/UNISWAP_LOAD_SUCCESS';
const UNISWAP_LOAD_FAILURE = 'uniswap/UNISWAP_LOAD_FAILURE';

const UNISWAP_LOAD_LIQUIDITY_TOKEN_INFO_SUCCESS =
  'uniswap/UNISWAP_LOAD_LIQUIDITY_TOKEN_INFO_SUCCESS';

const UNISWAP_UPDATE_PAIRS = 'uniswap/UNISWAP_UPDATE_PAIRS';
const UNISWAP_UPDATE_ALL_PAIRS = 'uniswap/UNISWAP_UPDATE_ALL_PAIRS';

const UNISWAP_UPDATE_REQUEST = 'uniswap/UNISWAP_UPDATE_REQUEST';
const UNISWAP_UPDATE_SUCCESS = 'uniswap/UNISWAP_UPDATE_SUCCESS';
const UNISWAP_UPDATE_FAILURE = 'uniswap/UNISWAP_UPDATE_FAILURE';

const UNISWAP_RESET_CURRENCIES_AND_RESERVES =
  'uniswap/UNISWAP_RESET_CURRENCIES_AND_RESERVES';
const UNISWAP_UPDATE_FAVORITES = 'uniswap/UNISWAP_UPDATE_FAVORITES';
const UNISWAP_UPDATE_TOKEN_RESERVES = 'uniswap/UNISWAP_UPDATE_TOKEN_RESERVES';
const UNISWAP_UPDATE_INPUT_CURRENCY_AND_RESERVE =
  'uniswap/UNISWAP_UPDATE_INPUT_CURRENCY_AND_RESERVE';
const UNISWAP_UPDATE_OUTPUT_CURRENCY_AND_RESERVE =
  'uniswap/UNISWAP_UPDATE_OUTPUT_CURRENCY_AND_RESERVE';
const UNISWAP_UPDATE_ALLOWANCES = 'uniswap/UNISWAP_UPDATE_ALLOWANCES';
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
    const allowances = await getAllowances(accountAddress, network);
    const favorites = await getUniswapFavorites(network);
    const liquidityTokens = await getLiquidity(accountAddress, network);
    dispatch({
      payload: {
        allowances,
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
    const allPairs =
      network === networkTypes.mainnet
        ? await getAllExchanges(tokenOverrides, ignoredTokens)
        : {};
    dispatch({
      payload: allPairs,
      type: UNISWAP_UPDATE_ALL_PAIRS,
    });
  } catch (error) {
    dispatch({
      payload: { allPairs: {} },
      type: UNISWAP_UPDATE_ALL_PAIRS,
    });
  }
};

export const uniswapPairsInit = () => async (dispatch, getState) => {
  try {
    const { tokenOverrides } = getState().data;
    const { network } = getState().settings;
    const pairs =
      network === networkTypes.mainnet
        ? await getUniswapPairs(tokenOverrides)
        : await getTestnetUniswapPairs(network);
    dispatch({
      payload: pairs,
      type: UNISWAP_UPDATE_PAIRS,
    });
    // eslint-disable-next-line no-empty
  } catch (error) {}
};

export const uniswapUpdateTokenReserves = (
  inputReserve,
  outputReserve
) => dispatch => {
  dispatch({
    payload: {
      inputReserve,
      outputReserve,
    },
    type: UNISWAP_UPDATE_TOKEN_RESERVES,
  });
};

export const uniswapUpdateInputCurrency = inputCurrency => async dispatch => {
  const inputReserve = await getReserve(get(inputCurrency, 'address', null));
  dispatch({
    payload: {
      inputCurrency,
      inputReserve,
    },
    type: UNISWAP_UPDATE_INPUT_CURRENCY_AND_RESERVE,
  });
};

export const uniswapUpdateOutputCurrency = outputCurrency => async dispatch => {
  const outputReserve = await getReserve(get(outputCurrency, 'address', null));
  dispatch({
    payload: {
      outputCurrency,
      outputReserve,
    },
    type: UNISWAP_UPDATE_OUTPUT_CURRENCY_AND_RESERVE,
  });
};

export const uniswapClearCurrenciesAndReserves = () => dispatch =>
  dispatch({ type: UNISWAP_RESET_CURRENCIES_AND_RESERVES });

export const uniswapClearState = () => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  removeUniswapStorage(accountAddress, network);
  dispatch({ type: UNISWAP_CLEAR_STATE });
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

export const uniswapUpdateAllowances = tokenAddressAllowances => (
  dispatch,
  getState
) => {
  const { accountAddress, network } = getState().settings;
  const { allowances } = getState().uniswap;
  const updatedAllowances = {
    ...allowances,
    ...tokenAddressAllowances,
  };
  dispatch({
    payload: updatedAllowances,
    type: UNISWAP_UPDATE_ALLOWANCES,
  });
  saveAllowances(updatedAllowances, accountAddress, network);
};

export const uniswapUpdateLiquidityTokens = (
  liquidityTokens,
  appendOrChange
) => (dispatch, getState) => {
  if (isEmpty(liquidityTokens)) return;
  let updatedLiquidityTokens = filter(liquidityTokens, hasTokenQuantity);
  if (appendOrChange) {
    const { liquidityTokens: existingLiquidityTokens } = getState().uniswap;
    updatedLiquidityTokens = uniq(
      concat(existingLiquidityTokens, ...updatedLiquidityTokens),
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
  allowances: {},
  allPairs: {},
  favorites: DefaultUniswapFavorites,
  fetchingUniswap: false,
  inputCurrency: null,
  inputReserve: null,
  isInitialized: false,
  liquidityTokens: [],
  loadingUniswap: false,
  outputCurrency: null,
  outputReserve: null,
  pairs: cleanUniswapAssetsFallback,
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
      case UNISWAP_UPDATE_ALL_PAIRS:
        draft.allPairs = action.payload;
        draft.isInitialized = true;
        break;
      case UNISWAP_UPDATE_PAIRS:
        draft.pairs = action.payload;
        break;
      case UNISWAP_LOAD_SUCCESS:
        draft.allowances = action.payload.allowances;
        draft.favorites = action.payload.favorites;
        draft.liquidityTokens = action.payload.liquidityTokens;
        draft.loadingUniswap = false;
        break;
      case UNISWAP_UPDATE_FAVORITES:
        draft.favorites = action.payload;
        break;
      case UNISWAP_UPDATE_TOKEN_RESERVES:
        draft.inputReserve = action.payload.inputReserve;
        draft.outputReserve = action.payload.outputReserve;
        break;
      case UNISWAP_UPDATE_INPUT_CURRENCY_AND_RESERVE:
        draft.inputCurrency = action.payload.inputCurrency;
        draft.inputReserve = action.payload.inputReserve;
        break;
      case UNISWAP_UPDATE_OUTPUT_CURRENCY_AND_RESERVE:
        draft.outputCurrency = action.payload.outputCurrency;
        draft.outputReserve = action.payload.outputReserve;
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
      case UNISWAP_UPDATE_ALLOWANCES:
        draft.allowances = action.payload;
        break;
      case UNISWAP_RESET_CURRENCIES_AND_RESERVES:
        draft.inputCurrency = INITIAL_UNISWAP_STATE.inputCurrency;
        draft.inputReserve = INITIAL_UNISWAP_STATE.inputReserve;
        draft.outputCurrency = INITIAL_UNISWAP_STATE.outputCurrency;
        draft.outputReserve = INITIAL_UNISWAP_STATE.outputReserve;
        break;
      case UNISWAP_CLEAR_STATE:
        return INITIAL_UNISWAP_STATE;
      default:
        break;
    }
  });
