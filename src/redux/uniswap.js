import produce from 'immer';
import {
  compact,
  concat,
  filter,
  get,
  invertBy,
  isEmpty,
  keyBy,
  keys,
  map,
  mapValues,
  omit,
  toLower,
  uniq,
  without,
} from 'lodash';
import {
  getAllowances,
  getLiquidity,
  getUniswapAssets,
  getUniswapFavorites,
  getUniswapLiquidityInfo,
  getUniswapPendingApprovals,
  removeUniswapStorage,
  saveAllowances,
  saveLiquidity,
  saveLiquidityInfo,
  saveUniswapAssets,
  saveUniswapFavorites,
  saveUniswapPendingApprovals,
} from '../handlers/localstorage/uniswap';
import {
  getLiquidityInfo,
  getReserve,
  getUniswapPairs,
} from '../handlers/uniswap';
import { includeExchangeAddress } from '../hoc/withUniswapAssets';
import { cleanUniswapAssetsFallback } from '../references';
import { resubscribeAssets } from './explorer';

// -- Constants ------------------------------------------------------------- //
const UNISWAP_LOAD_REQUEST = 'uniswap/UNISWAP_LOAD_REQUEST';
const UNISWAP_LOAD_SUCCESS = 'uniswap/UNISWAP_LOAD_SUCCESS';
const UNISWAP_LOAD_FAILURE = 'uniswap/UNISWAP_LOAD_FAILURE';

const UNISWAP_LOAD_LIQUIDITY_TOKEN_INFO_SUCCESS =
  'uniswap/UNISWAP_LOAD_LIQUIDITY_TOKEN_INFO_SUCCESS';

const UNISWAP_UPDATE_PAIRS = 'uniswap/UNISWAP_UPDATE_PAIRS';

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
const UNISWAP_UPDATE_PENDING_APPROVALS =
  'uniswap/UNISWAP_UPDATE_PENDING_APPROVALS';
const UNISWAP_UPDATE_ASSETS = 'uniswap/UNISWAP_UPDATE_ASSETS';
const UNISWAP_UPDATE_ALLOWANCES = 'uniswap/UNISWAP_UPDATE_ALLOWANCES';
const UNISWAP_UPDATE_LIQUIDITY_TOKENS =
  'uniswap/UNISWAP_UPDATE_LIQUIDITY_TOKENS';
const UNISWAP_CLEAR_STATE = 'uniswap/UNISWAP_CLEAR_STATE';

// -- Actions --------------------------------------------------------------- //
const extractTransactionHash = txn => toLower(txn.hash).split('-')[0];
const firstItem = value => get(value, '[0]');
const lowerAddress = asset => toLower(asset.address);
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
    const favorites = await getUniswapFavorites();
    const liquidityTokens = await getLiquidity(accountAddress, network);
    const pendingApprovals = await getUniswapPendingApprovals(
      accountAddress,
      network
    );
    const uniswapAssets = await getUniswapAssets(accountAddress, network);
    dispatch({
      payload: {
        allowances,
        favorites,
        liquidityTokens,
        pendingApprovals,
        uniswapAssets,
      },
      type: UNISWAP_LOAD_SUCCESS,
    });
  } catch (error) {
    dispatch({ type: UNISWAP_LOAD_FAILURE });
  }
};

export const uniswapPairsInit = () => async (dispatch, getState) => {
  try {
    const { tokenOverrides } = getState().data;
    const { pairs: existingPairs } = getState().uniswap;
    const pairs = await getUniswapPairs(tokenOverrides);
    dispatch(uniswapUpdatePairs(pairs));
    dispatch(resubscribeAssets(keys(existingPairs), keys(pairs)));
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

export const uniswapAddPendingApproval = (
  tokenAddress,
  txHash,
  creationTimestamp,
  estimatedTimeInMs
) => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  const { pendingApprovals } = getState().uniswap;
  const updatedPendingApprovals = {
    ...pendingApprovals,
    [toLower(tokenAddress)]: {
      creationTimestamp,
      estimatedTimeInMs,
      hash: toLower(txHash),
    },
  };
  dispatch({
    payload: updatedPendingApprovals,
    type: UNISWAP_UPDATE_PENDING_APPROVALS,
  });
  saveUniswapPendingApprovals(updatedPendingApprovals, accountAddress, network);
};

export const uniswapRemovePendingApproval = transactions => (
  dispatch,
  getState
) => {
  const loweredTxHashes = map(transactions, extractTransactionHash);
  const { pendingApprovals } = getState().uniswap;
  const invertedPendingApprovals = mapValues(
    invertBy(pendingApprovals, value => value.hash),
    firstItem
  );
  const updatedAddresses = compact(
    map(loweredTxHashes, hash => invertedPendingApprovals[hash])
  );
  if (isEmpty(updatedAddresses)) return;
  const updatedPendingApprovals = omit(pendingApprovals, ...updatedAddresses);
  dispatch({
    payload: updatedPendingApprovals,
    type: UNISWAP_UPDATE_PENDING_APPROVALS,
  });
  const { accountAddress, network } = getState().settings;
  saveUniswapPendingApprovals(updatedPendingApprovals, accountAddress, network);
};

export const uniswapUpdateFavorites = (assetAddress, add = true) => (
  dispatch,
  getState
) => {
  const address = toLower(assetAddress);
  const { favorites } = getState().uniswap;
  const updatedFavorites = add
    ? uniq(concat(favorites, address))
    : without(favorites, address);
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

export const uniswapUpdateAssets = assets => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  const { pairs } = getState().uniswap;
  const uniswapAssetPrices = map(assets, includeExchangeAddress(pairs));
  const mappedAssets = keyBy(uniswapAssetPrices, lowerAddress);
  dispatch({
    payload: mappedAssets,
    type: UNISWAP_UPDATE_ASSETS,
  });
  saveUniswapAssets(mappedAssets, accountAddress, network);
};

export const uniswapUpdatePairs = pairs => dispatch =>
  dispatch({
    payload: pairs,
    type: UNISWAP_UPDATE_PAIRS,
  });

export const uniswapUpdateAssetPrice = (address, price) => (
  dispatch,
  getState
) => {
  const addressKey = toLower(address);
  const { accountAddress, network } = getState().settings;
  const { uniswapAssets } = getState().uniswap;
  const updatedAsset = { ...uniswapAssets[addressKey], price };
  const updatedAssets = {
    ...uniswapAssets,
    [addressKey]: updatedAsset,
  };
  dispatch({
    payload: updatedAssets,
    type: UNISWAP_UPDATE_ASSETS,
  });
  saveUniswapAssets(updatedAssets, accountAddress, network);
};

export const uniswapUpdateLiquidityTokens = (
  liquidityTokens,
  appendOrChange
) => (dispatch, getState) => {
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
    const { liquidityTokens } = getState().uniswap;

    if (isEmpty(liquidityTokens)) {
      return resolve(false);
    }

    dispatch({ type: UNISWAP_UPDATE_REQUEST });

    const exchangeContracts = map(liquidityTokens, getAssetCode);
    return getLiquidityInfo(accountAddress, exchangeContracts)
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
  favorites: [],
  fetchingUniswap: false,
  inputCurrency: null,
  inputReserve: null,
  liquidityTokens: [],
  loadingUniswap: false,
  outputCurrency: null,
  outputReserve: null,
  pairs: cleanUniswapAssetsFallback,
  pendingApprovals: {},
  uniswapAssets: {},
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
      case UNISWAP_UPDATE_PAIRS:
        draft.pairs = action.payload;
        break;
      case UNISWAP_LOAD_SUCCESS:
        draft.allowances = action.payload.allowances;
        draft.favorites = action.payload.favorites;
        draft.liquidityTokens = action.payload.liquidityTokens;
        draft.loadingUniswap = false;
        draft.pendingApprovals = action.payload.pendingApprovals;
        draft.uniswapAssets = action.payload.uniswapAssets;
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
      case UNISWAP_UPDATE_PENDING_APPROVALS:
        draft.pendingApprovals = action.payload;
        break;
      case UNISWAP_UPDATE_ALLOWANCES:
        draft.allowances = action.payload;
        break;
      case UNISWAP_UPDATE_ASSETS:
        draft.uniswapAssets = action.payload;
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
