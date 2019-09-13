import produce from 'immer';
import {
  compact,
  concat,
  forEach,
  fromPairs,
  get,
  invertBy,
  isEmpty,
  keyBy,
  map,
  mapValues,
  omit,
  reject,
  toLower,
  zip,
} from 'lodash';
import {
  getAccountLocal,
  removeAccountLocal,
  saveAccountLocal,
} from '../handlers/localstorage/common';
import {
  getLiquidityInfo,
  getReserve,
  getReserves,
} from '../handlers/uniswap';
import TransactionStatusTypes from '../helpers/transactionStatusTypes';
import { uniswapAssetsClean } from '../references';
import { contractUtils, promiseUtils } from '../utils';

// -- Constants ------------------------------------------------------------- //
const UNISWAP_LOAD_REQUEST = 'uniswap/UNISWAP_LOAD_REQUEST';
const UNISWAP_LOAD_SUCCESS = 'uniswap/UNISWAP_LOAD_SUCCESS';
const UNISWAP_LOAD_FAILURE = 'uniswap/UNISWAP_LOAD_FAILURE';

const UNISWAP_UPDATE_REQUEST = 'uniswap/UNISWAP_UPDATE_REQUEST';
const UNISWAP_UPDATE_SUCCESS = 'uniswap/UNISWAP_UPDATE_SUCCESS';
const UNISWAP_UPDATE_FAILURE = 'uniswap/UNISWAP_UPDATE_FAILURE';

const UNISWAP_GET_TOKEN_RESERVES_REQUEST =
  'uniswap/UNISWAP_GET_TOKEN_RESERVES_REQUEST';
const UNISWAP_GET_TOKEN_RESERVES_SUCCESS =
  'uniswap/UNISWAP_GET_TOKEN_RESERVES_SUCCESS';
const UNISWAP_GET_TOKEN_RESERVES_FAILURE =
  'uniswap/UNISWAP_GET_TOKEN_RESERVES_FAILURE';

const UNISWAP_UPDATE_PENDING_APPROVALS = 'uniswap/UNISWAP_UPDATE_PENDING_APPROVALS';
const UNISWAP_UPDATE_ASSETS = 'uniswap/UNISWAP_UPDATE_ASSETS';
const UNISWAP_UPDATE_ALLOWANCES = 'uniswap/UNISWAP_UPDATE_ALLOWANCES';
const UNISWAP_UPDATE_LIQUIDITY_TOKENS =
  'uniswap/UNISWAP_UPDATE_LIQUIDITY_TOKENS';
const UNISWAP_CLEAR_STATE = 'uniswap/UNISWAP_CLEAR_STATE';

// Localstorage keys
export const ALLOWANCES = 'uniswapallowances';
export const LIQUIDITY = 'uniswapliquidity';
export const LIQUIDITY_INFO = 'uniswap';
export const PENDING_APPROVALS = 'uniswappendingapprovals';
export const RESERVES = 'uniswapreserves';
export const ASSETS = 'uniswapassets';

// -- Actions --------------------------------------------------------------- //
let getTokenReservesInterval = null;

export const uniswapLoadState = () => async (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  dispatch({ type: UNISWAP_LOAD_REQUEST });
  try {
    const uniswap = await getAccountLocal(
      LIQUIDITY_INFO,
      accountAddress,
      network,
      {}
    );
    const liquidityTokens = await getAccountLocal(
      LIQUIDITY,
      accountAddress,
      network
    );
    const allowances = await getAccountLocal(
      ALLOWANCES,
      accountAddress,
      network,
      {}
    );
    const tokenReserves = await getAccountLocal(
      RESERVES,
      accountAddress,
      network,
      {}
    );
    const uniswapAssets = await getAccountLocal(
      ASSETS,
      accountAddress,
      network,
      {}
    );
    const pendingApprovals = await getAccountLocal(
      PENDING_APPROVALS,
      accountAddress,
      network,
      {},
    );
    dispatch({
      payload: {
        allowances,
        liquidityTokens,
        pendingApprovals,
        tokenReserves,
        uniswap,
        uniswapAssets,
      },
      type: UNISWAP_LOAD_SUCCESS,
    });
  } catch (error) {
    dispatch({ type: UNISWAP_LOAD_FAILURE });
  }
};

export const uniswapGetTokenReserve = tokenAddress => (dispatch, getState) =>
  new Promise((resolve, promiseReject) => {
    tokenAddress = toLower(tokenAddress);
    dispatch({ type: UNISWAP_GET_TOKEN_RESERVES_REQUEST });
    const { accountAddress, network } = getState().settings;
    const { tokenReserves } = getState().uniswap;
    getReserve(tokenAddress)
      .then(tokenReserve => {
        const updatedTokenReserves = {
          ...tokenReserves,
          [tokenAddress]: tokenReserve,
        };
        dispatch({
          payload: updatedTokenReserves,
          type: UNISWAP_GET_TOKEN_RESERVES_SUCCESS,
        });
        saveAccountLocal(
          RESERVES,
          updatedTokenReserves,
          accountAddress,
          network
        );
        resolve(tokenReserve);
      })
      .catch(error => {
        dispatch({ type: UNISWAP_GET_TOKEN_RESERVES_FAILURE });
        promiseReject(error);
      });
  });

export const uniswapTokenReservesRefreshState = () => (dispatch, getState) =>
  new Promise((resolve, promiseReject) => {
    const fetchTokenReserves = () =>
      new Promise((fetchResolve, fetchReject) => {
        dispatch({ type: UNISWAP_GET_TOKEN_RESERVES_REQUEST });
        const { accountAddress, network } = getState().settings;
        getReserves()
          .then(tokenReserves => {
            dispatch({
              payload: tokenReserves,
              type: UNISWAP_GET_TOKEN_RESERVES_SUCCESS,
            });
            saveAccountLocal(RESERVES, tokenReserves, accountAddress, network);
            fetchResolve(true);
          })
          .catch(error => {
            dispatch({ type: UNISWAP_GET_TOKEN_RESERVES_FAILURE });
            fetchReject(error);
          });
      });

    return fetchTokenReserves()
      .then(() => {
        clearInterval(getTokenReservesInterval);
        getTokenReservesInterval = setInterval(fetchTokenReserves, 15000); // 15 secs
        resolve(true);
      })
      .catch(error => {
        clearInterval(getTokenReservesInterval);
        getTokenReservesInterval = setInterval(fetchTokenReserves, 15000); // 15 secs
        promiseReject(error);
      });
  });

export const uniswapClearState = () => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  const storageKeys = [
    ASSETS,
    ALLOWANCES,
    LIQUIDITY_INFO,
    LIQUIDITY,
    PENDING_APPROVALS,
    RESERVES,
  ];
  forEach(storageKeys, key => removeAccountLocal(key, accountAddress, network));
  clearInterval(getTokenReservesInterval);
  dispatch({ type: UNISWAP_CLEAR_STATE });
};

export const uniswapUpdatePendingApprovals = (
  tokenAddress,
  txHash,
  creationTimestamp,
  estimatedTimeInMs,
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
  saveAccountLocal(PENDING_APPROVALS, updatedPendingApprovals, accountAddress, network);
};


const updateAllowancesForSuccessfulTransactions = (assetAddresses) => (dispatch, getState) => {
  if (isEmpty(assetAddresses)) return;
  const { accountAddress } = getState().settings;
  promiseUtils.PromiseAllWithFails(map(assetAddresses, async (assetAddress) => {
    const asset = uniswapAssetsRawLoweredKeys[assetAddress];
    return contractUtils.getAllowance(
      accountAddress,
      asset,
      asset.exchangeAddress,
    );
  })).then(allowances => {
    const tokenAddressAllowances = fromPairs(zip(assetAddresses, allowances));
    dispatch(uniswapUpdateAllowances(tokenAddressAllowances));
  }).catch(error => {
    // TODO error handling
  });
};

export const uniswapRemovePendingApproval = (transactions) => (dispatch, getState) => {
  const newTransactions = map(transactions, txn => ({
    ...txn,
    hash: toLower(txn.hash).split('-')[0],
  }));
  const { pendingApprovals } = getState().uniswap;
  const loweredTxHashes = map(newTransactions, txn => txn.hash);
  const invertedPendingApprovals = mapValues(invertBy(pendingApprovals, value => value.hash), value => get(value, '[0]'));
  const updatedAddresses = compact(map(loweredTxHashes, hash => invertedPendingApprovals[hash]));
  if (isEmpty(updatedAddresses)) return;
  const updatedPendingApprovals = omit(pendingApprovals, ...updatedAddresses);
  dispatch({
    payload: updatedPendingApprovals,
    type: UNISWAP_UPDATE_PENDING_APPROVALS,
  });
  const successfulApprovalHashes = map(reject(newTransactions, txn => txn.status === TransactionStatusTypes.failed), txn => toLower(txn.hash));
  const successfullyApprovedAddresses = compact(map(successfulApprovalHashes, hash => invertedPendingApprovals[hash]));
  dispatch(updateAllowancesForSuccessfulTransactions(successfullyApprovedAddresses));
  const { accountAddress, network } = getState().settings;
  saveAccountLocal(PENDING_APPROVALS, updatedPendingApprovals, accountAddress, network);
};

export const uniswapUpdateAllowances = (tokenAddressAllowances) => (dispatch, getState) => {
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
  saveAccountLocal(ALLOWANCES, updatedAllowances, accountAddress, network);
};

export const uniswapUpdateAssets = assets => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  const uniswapAssetPrices = map(assets, asset => {
    const loweredAddress = toLower(asset.address);
    return {
      ...asset,
      exchangeAddress: get(
        uniswapAssetsClean,
        `[${loweredAddress}].exchangeAddress`
      ),
    };
  });
  const mappedAssets = keyBy(uniswapAssetPrices, asset =>
    toLower(asset.address)
  );
  dispatch({
    payload: mappedAssets,
    type: UNISWAP_UPDATE_ASSETS,
  });
  saveAccountLocal(ASSETS, mappedAssets, accountAddress, network);
};

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
  saveAccountLocal(ASSETS, updatedAssets, accountAddress, network);
};

export const uniswapUpdateLiquidityTokens = liquidityTokens => (
  dispatch,
  getState
) => {
  if (isEmpty(liquidityTokens)) return;
  const { accountAddress, network } = getState().settings;
  dispatch({
    payload: liquidityTokens,
    type: UNISWAP_UPDATE_LIQUIDITY_TOKENS,
  });
  saveAccountLocal(LIQUIDITY, liquidityTokens, accountAddress, network);
  dispatch(uniswapUpdateState());
};

export const uniswapAddLiquidityTokens = newLiquidityTokens => (
  dispatch,
  getState
) => {
  if (isEmpty(newLiquidityTokens)) return;
  const { accountAddress, network } = getState().settings;
  const { liquidityTokens } = getState().uniswap;
  const updatedLiquidityTokens = concat(liquidityTokens, ...newLiquidityTokens);
  dispatch({
    payload: updatedLiquidityTokens,
    type: UNISWAP_UPDATE_LIQUIDITY_TOKENS,
  });
  saveAccountLocal(LIQUIDITY, updatedLiquidityTokens, accountAddress, network);
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

    const exchangeContracts = map(liquidityTokens, x =>
      get(x, 'asset.asset_code')
    );
    return getLiquidityInfo(accountAddress, exchangeContracts)
      .then(uniswap => {
        saveAccountLocal(LIQUIDITY_INFO, uniswap, accountAddress, network);
        dispatch({
          payload: uniswap,
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
  fetchingUniswap: false,
  liquidityTokens: [],
  loadingUniswap: false,
  pendingApprovals: {},
  tokenReserves: {},
  uniswap: {},
  uniswapAssets: {},
};

export default (state = INITIAL_UNISWAP_STATE, action) =>
  produce(state, draft => {
    switch (action.type) {
    case UNISWAP_LOAD_REQUEST:
      draft.loadingUniswap = true;
      break;
    case UNISWAP_LOAD_SUCCESS:
      draft.allowances = action.payload.allowances;
      draft.liquidityTokens = action.payload.liquidityTokens;
      draft.loadingUniswap = false;
      draft.pendingApprovals = action.payload.pendingApprovals;
      draft.tokenReserves = action.payload.tokenReserves;
      draft.uniswap = action.payload.uniswap;
      draft.uniswapAssets = action.payload.uniswapAssets;
      break;
    case UNISWAP_LOAD_FAILURE:
      draft.loadingUniswap = false;
      break;
    case UNISWAP_UPDATE_REQUEST:
      draft.fetchingUniswap = true;
      break;
    case UNISWAP_UPDATE_SUCCESS:
      draft.fetchingUniswap = false;
      draft.uniswap = action.payload;
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
    case UNISWAP_GET_TOKEN_RESERVES_SUCCESS:
      draft.tokenReserves = action.payload;
      break;
    case UNISWAP_CLEAR_STATE:
      return INITIAL_UNISWAP_STATE;
    default:
      break;
    }
});
