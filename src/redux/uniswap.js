import produce from 'immer';
import {
  concat,
  get,
  isEmpty,
  map,
} from 'lodash';
import {
  getUniswapAllowances,
  getUniswapLiquidityInfo,
  getUniswapLiquidityTokens,
  getUniswapTokenReserves,
  removeUniswapAllowances,
  removeUniswapLiquidityInfo,
  removeUniswapLiquidityTokens,
  removeUniswapTokenReserves,
  saveUniswapAllowances,
  saveUniswapLiquidityInfo,
  saveUniswapLiquidityTokens,
  saveUniswapTokenReserves,
} from '../handlers/commonStorage';
import {
  getLiquidityInfo,
  getReserve,
  getReserves,
} from '../handlers/uniswap';

// -- Constants ------------------------------------------------------------- //
const UNISWAP_LOAD_REQUEST = 'uniswap/UNISWAP_LOAD_REQUEST';
const UNISWAP_LOAD_SUCCESS = 'uniswap/UNISWAP_LOAD_SUCCESS';
const UNISWAP_LOAD_FAILURE = 'uniswap/UNISWAP_LOAD_FAILURE';

const UNISWAP_UPDATE_REQUEST = 'uniswap/UNISWAP_UPDATE_REQUEST';
const UNISWAP_UPDATE_SUCCESS = 'uniswap/UNISWAP_UPDATE_SUCCESS';
const UNISWAP_UPDATE_FAILURE = 'uniswap/UNISWAP_UPDATE_FAILURE';

const UNISWAP_GET_TOKEN_RESERVES_REQUEST = 'uniswap/UNISWAP_GET_TOKEN_RESERVES_REQUEST';
const UNISWAP_GET_TOKEN_RESERVES_SUCCESS = 'uniswap/UNISWAP_GET_TOKEN_RESERVES_SUCCESS';
const UNISWAP_GET_TOKEN_RESERVES_FAILURE = 'uniswap/UNISWAP_GET_TOKEN_RESERVES_FAILURE';

const UNISWAP_UPDATE_ALLOWANCES = 'uniswap/UNISWAP_UPDATE_ALLOWANCES';
const UNISWAP_UPDATE_LIQUIDITY_TOKENS = 'uniswap/UNISWAP_UPDATE_LIQUIDITY_TOKENS';
const UNISWAP_CLEAR_STATE = 'uniswap/UNISWAP_CLEAR_STATE';

// -- Actions --------------------------------------------------------------- //
let getTokenReservesInterval = null;

export const uniswapLoadState = () => async (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  dispatch({ type: UNISWAP_LOAD_REQUEST });
  try {
    const uniswap = await getUniswapLiquidityInfo(accountAddress, network);
    const liquidityTokens = await getUniswapLiquidityTokens(accountAddress, network);
    const allowances = await getUniswapAllowances(accountAddress, network);
    const tokenReserves = await getUniswapTokenReserves(accountAddress, network);
    dispatch({
      payload: {
        allowances,
        liquidityTokens,
        tokenReserves,
        uniswap,
      },
      type: UNISWAP_LOAD_SUCCESS,
    });
  } catch (error) {
    dispatch({ type: UNISWAP_LOAD_FAILURE });
  }
};

export const uniswapGetTokenReserve = (tokenAddress) => (dispatch, getState) => (
  new Promise((resolve, reject) => {
    tokenAddress = tokenAddress.toLowerCase();
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
        saveUniswapTokenReserves(accountAddress, updatedTokenReserves, network);
        resolve(tokenReserve);
      }).catch(error => {
        dispatch({ type: UNISWAP_GET_TOKEN_RESERVES_FAILURE });
        reject(null);
      });
  })
);

export const uniswapTokenReservesRefreshState = () => (dispatch, getState) => (
  new Promise((resolve, reject) => {
    const fetchTokenReserves = () => new Promise((fetchResolve, fetchReject) => {
      dispatch({ type: UNISWAP_GET_TOKEN_RESERVES_REQUEST });
      const { accountAddress, network } = getState().settings;
      getReserves()
        .then(tokenReserves => {
          dispatch({
            payload: tokenReserves,
            type: UNISWAP_GET_TOKEN_RESERVES_SUCCESS,
          });
          saveUniswapTokenReserves(accountAddress, tokenReserves, network);
          fetchResolve(true);
        }).catch(error => {
          dispatch({ type: UNISWAP_GET_TOKEN_RESERVES_FAILURE });
          fetchReject(error);
        });
    });

    return fetchTokenReserves().then(() => {
      clearInterval(getTokenReservesInterval);
      getTokenReservesInterval = setInterval(fetchTokenReserves, 15000); // 15 secs
      resolve(true);
    }).catch(error => {
      clearInterval(getTokenReservesInterval);
      getTokenReservesInterval = setInterval(fetchTokenReserves, 15000); // 15 secs
      reject(error);
    });
  })
);

export const uniswapClearState = () => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  removeUniswapAllowances(accountAddress, network);
  removeUniswapLiquidityInfo(accountAddress, network);
  removeUniswapLiquidityTokens(accountAddress, network);
  removeUniswapTokenReserves(accountAddress, network);
  clearInterval(getTokenReservesInterval);
  dispatch({ type: UNISWAP_CLEAR_STATE });
};

export const uniswapUpdateAllowances = (tokenAddress, allowance) => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  const { allowances } = getState().uniswap;
  const updatedAllowances = { ...allowances, [tokenAddress]: allowance };
  dispatch({
    payload: updatedAllowances,
    type: UNISWAP_UPDATE_ALLOWANCES,
  });
  saveUniswapAllowances(accountAddress, updatedAllowances, network);
};

export const uniswapUpdateLiquidityTokens = (liquidityTokens) => (dispatch, getState) => {
  if (isEmpty(liquidityTokens)) return;
  const { accountAddress, network } = getState().settings;
  dispatch({
    payload: liquidityTokens,
    type: UNISWAP_UPDATE_LIQUIDITY_TOKENS,
  });
  saveUniswapLiquidityTokens(accountAddress, liquidityTokens, network);
  dispatch(uniswapUpdateState());
};

export const uniswapAddLiquidityTokens = (newLiquidityTokens) => (dispatch, getState) => {
  if (isEmpty(newLiquidityTokens)) return;
  const { accountAddress, network } = getState().settings;
  const { liquidityTokens } = getState().uniswap;
  const updatedLiquidityTokens = concat(liquidityTokens, ...newLiquidityTokens);
  dispatch({
    payload: updatedLiquidityTokens,
    type: UNISWAP_UPDATE_LIQUIDITY_TOKENS,
  });
  saveUniswapLiquidityTokens(accountAddress, updatedLiquidityTokens, network);
  dispatch(uniswapUpdateState());
};

export const uniswapUpdateState = () => (dispatch, getState) => (
  new Promise((resolve, reject) => {
    const { accountAddress, network } = getState().settings;
    const { liquidityTokens } = getState().uniswap;

    if (isEmpty(liquidityTokens)) {
      return resolve(false);
    }

    dispatch({ type: UNISWAP_UPDATE_REQUEST });

    const exchangeContracts = map(liquidityTokens, x => get(x, 'asset.asset_code'));
    return getLiquidityInfo(accountAddress, exchangeContracts)
      .then(uniswap => {
        saveUniswapLiquidityInfo(accountAddress, uniswap, network);
        dispatch({
          payload: uniswap,
          type: UNISWAP_UPDATE_SUCCESS,
        });
        resolve(true);
      })
      .catch(error => {
        dispatch({ type: UNISWAP_UPDATE_FAILURE });
        reject(error);
      });
  })
);

// -- Reducer --------------------------------------------------------------- //
export const INITIAL_UNISWAP_STATE = {
  allowances: {},
  fetchingUniswap: false,
  liquidityTokens: [],
  loadingUniswap: false,
  tokenReserves: {},
  uniswap: {},
};

export default (state = INITIAL_UNISWAP_STATE, action) => produce(state, draft => {
  switch (action.type) {
  case UNISWAP_LOAD_REQUEST:
    draft.loadingUniswap = true;
    break;
  case UNISWAP_LOAD_SUCCESS:
    draft.loadingUniswap = false;
    draft.allowances = action.payload.allowances;
    draft.uniswap = action.payload.uniswap;
    draft.liquidityTokens = action.payload.liquidityTokens;
    draft.tokenReserves = action.payload.tokenReserves;
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
  case UNISWAP_UPDATE_ALLOWANCES:
    draft.allowances = action.payload;
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
